import type { CreatorContentInsight } from '../entities.js';
import { type DomainError, domainError } from '../errors.js';
import type {
  AnalyzableItem,
  Clock,
  ConsentRepository,
  ContentAnalyzer,
  ContentScrapingProvider,
  CreatorContentRepository,
  CreatorRepository,
  EventPublisher,
  NewContentItemInput,
  TranscriptionProvider,
} from '../ports.js';
import { type Result, err, ok } from '../result.js';

/** Tipos de contenido con medio audiovisual: se transcriben. */
const TRANSCRIBABLE = new Set(['video', 'short', 'reel', 'live']);

export interface AnalyzeCreatorContentInput {
  accountId: string;
  /** Tope de piezas a transcribir por red (control de costo). */
  maxItemsPerNetwork?: number;
}

export interface AnalyzeCreatorContentDeps {
  creators: CreatorRepository;
  content: CreatorContentRepository;
  consents: ConsentRepository;
  scraper: ContentScrapingProvider;
  transcriber: TranscriptionProvider;
  analyzer: ContentAnalyzer;
  events: EventPublisher;
  clock: Clock;
}

/**
 * AnalyzeCreatorContent — raspa el contenido de las redes del creador, transcribe
 * los videos, cuenta vistas y clasifica para derivar CATEGORÍA y AUDIENCIA (§12).
 *
 * Invariantes:
 *  - La cuenta debe tener perfil de creador con enlaces registrados.
 *  - Exige consentimiento `ai_processing` vigente (Ley 1581): analizar el
 *    contenido es tratamiento con IA de datos personales.
 *  - Métricas y categorías se CALCULAN aquí; nunca las declara el creador.
 *  - Si una red falla, se marca su enlace como `failed` y se sigue con las demás;
 *    solo si TODAS fallan se devuelve SCRAPING_FAILED.
 */
export async function analyzeCreatorContent(
  deps: AnalyzeCreatorContentDeps,
  input: AnalyzeCreatorContentInput,
): Promise<Result<CreatorContentInsight, DomainError>> {
  const { creators, content, consents, scraper, transcriber, analyzer, events, clock } = deps;
  const maxPerNetwork = input.maxItemsPerNetwork ?? 10;

  const creator = await creators.findByAccountId(input.accountId);
  if (!creator) {
    return err(domainError('CREATOR_NOT_FOUND', 'No tienes un perfil de creador'));
  }

  const current = await consents.currentFor(input.accountId);
  const aiConsent = current.find((c) => c.purpose === 'ai_processing');
  if (!aiConsent?.granted) {
    return err(
      domainError('CONSENT_REQUIRED', 'Debes autorizar el análisis con IA de tu contenido'),
    );
  }

  const links = await content.listSocialLinks(creator.id);
  if (links.length === 0) {
    return err(domainError('NO_SOCIAL_LINKS', 'No hay enlaces de redes para analizar'));
  }

  const now = clock.now();
  const items: NewContentItemInput[] = [];
  const analyzable: AnalyzableItem[] = [];
  const networkSummaries: {
    network: string;
    followers: number;
    avgViews: number;
    items: number;
  }[] = [];
  let anySuccess = false;

  for (const link of links) {
    try {
      const profile = await scraper.fetchProfile({ network: link.network, url: link.url });
      anySuccess = true;

      let networkViews = 0;
      let networkItems = 0;
      let transcribed = 0;
      for (const scraped of profile.items) {
        let transcript: string | null = null;
        let language: string | null = null;
        if (TRANSCRIBABLE.has(scraped.kind) && scraped.mediaUrl && transcribed < maxPerNetwork) {
          const t = await transcriber.transcribe({
            mediaUrl: scraped.mediaUrl,
            network: link.network,
          });
          transcript = t.text;
          language = t.language;
          transcribed += 1;
        }

        items.push({
          network: link.network,
          kind: scraped.kind,
          externalId: scraped.externalId,
          url: scraped.url,
          title: scraped.title,
          views: scraped.views,
          likes: scraped.likes,
          comments: scraped.comments,
          shares: scraped.shares,
          durationSeconds: scraped.durationSeconds,
          publishedAt: scraped.publishedAt,
          transcript,
          language,
          topics: [],
          analyzedAt: now,
        });
        analyzable.push({
          network: link.network,
          kind: scraped.kind,
          transcript,
          caption: scraped.caption,
          views: scraped.views,
        });
        networkViews += scraped.views;
        networkItems += 1;
      }

      networkSummaries.push({
        network: link.network,
        followers: profile.followers,
        avgViews: networkItems ? Math.round(networkViews / networkItems) : 0,
        items: networkItems,
      });
      await content.markLinkAnalyzed({ id: link.id, status: 'verified', at: now });
    } catch {
      await content.markLinkAnalyzed({ id: link.id, status: 'failed', at: now });
    }
  }

  if (!anySuccess) {
    return err(
      domainError('SCRAPING_FAILED', 'No pudimos analizar ninguna de tus redes; intenta luego'),
    );
  }

  // Clasificación agregada + temas por pieza (alineados al orden de `items`).
  const analysis = await analyzer.analyze({
    items: analyzable,
    declaredCategories: creator.categories,
  });
  for (let i = 0; i < items.length; i++) {
    items[i]!.topics = analysis.itemTopics[i] ?? [];
  }

  // Métricas calculadas.
  const itemsAnalyzed = items.length;
  const totalViews = items.reduce((sum, it) => sum + it.views, 0);
  const avgViews = itemsAnalyzed ? totalViews / itemsAnalyzed : 0;
  const withViews = items.filter((it) => it.views > 0);
  const avgEngagementRate = withViews.length
    ? withViews.reduce((sum, it) => sum + (it.likes + it.comments + it.shares) / it.views, 0) /
      withViews.length
    : null;

  await content.replaceContentItems(creator.id, items);

  const insight = await content.saveInsight({
    creatorProfileId: creator.id,
    status: 'completed',
    itemsAnalyzed,
    totalViews,
    avgViews,
    avgEngagementRate,
    suggestedCategories: analysis.suggestedCategories,
    topTopics: analysis.topTopics,
    audience: analysis.audience,
    brandSafety: analysis.brandSafety,
    networks: networkSummaries,
    analyzedAt: now,
  });

  await events.publish({
    eventType: 'creator.content_analyzed',
    aggregateType: 'creator_profile',
    aggregateId: creator.id,
    actorAccountId: input.accountId,
    payload: {
      itemsAnalyzed,
      totalViews,
      suggestedCategories: analysis.suggestedCategories,
    },
  });

  return ok(insight);
}
