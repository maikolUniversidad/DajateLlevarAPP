import { describe, expect, it } from 'vitest';
import type { CreatorContentInsight, CreatorProfile, CreatorSocialLink } from '../entities.js';
import type {
  Clock,
  ConsentRepository,
  ContentAnalyzer,
  ContentScrapingProvider,
  CreatorContentRepository,
  CreatorRepository,
  DomainEventInput,
  EventPublisher,
  NewContentInsightInput,
  NewContentItemInput,
  ScrapedProfile,
  TranscriptionProvider,
} from '../ports.js';
import { analyzeCreatorContent } from './analyze-creator-content.js';

const CREATOR: CreatorProfile = {
  id: 'crt-1',
  accountId: 'acc-1',
  handle: 'juanita.llano',
  bio: null,
  categories: ['gastronomia'],
  cities: ['Villavicencio'],
  languages: ['es'],
  isAcceptingWork: true,
  totalFollowers: 0,
  avgEngagementRate: null,
  fidelityIndex: null,
  fidelitySampleSize: 0,
  conversionRate: null,
  totalAttributedGmv: { amount: 0, currency: 'COP' },
  onTimeDeliveryRate: null,
  avgRevisionRounds: null,
  createdAt: new Date('2026-08-07T10:00:00-05:00'),
};

const NOW = new Date('2026-08-07T10:00:00-05:00');

function link(id: string, network: string): CreatorSocialLink {
  return {
    id,
    creatorProfileId: CREATOR.id,
    network,
    url: `https://${network}.com/juanita`,
    handle: 'juanita',
    status: 'pending',
    lastAnalyzedAt: null,
  };
}

function profileWith(network: string, views: number[]): ScrapedProfile {
  return {
    network,
    networkUserId: 'nu-1',
    handle: 'juanita',
    followers: 10_000,
    items: views.map((v, i) => ({
      externalId: `${network}-${i}`,
      kind: 'video',
      url: `https://${network}.com/v/${i}`,
      title: `Video ${i}`,
      views: v,
      likes: Math.round(v * 0.1),
      comments: Math.round(v * 0.02),
      shares: Math.round(v * 0.01),
      durationSeconds: 30,
      publishedAt: NOW,
      mediaUrl: `https://cdn/${network}/${i}.mp4`,
      caption: 'receta llanera',
    })),
  };
}

function makeDeps(opts?: {
  missingCreator?: boolean;
  noConsent?: boolean;
  noLinks?: boolean;
  failNetworks?: string[];
}) {
  const events: DomainEventInput[] = [];
  const linkMarks: { id: string; status: string }[] = [];
  let savedItems: NewContentItemInput[] = [];
  let savedInsight: NewContentInsightInput | null = null;

  const creators = {
    findByAccountId: async () => (opts?.missingCreator ? null : CREATOR),
  } as unknown as CreatorRepository;

  const consents = {
    currentFor: async () =>
      opts?.noConsent
        ? []
        : [
            {
              purpose: 'ai_processing' as const,
              granted: true,
              grantedAt: NOW,
              revokedAt: null,
              policyVersion: 'v1',
            },
          ],
  } as unknown as ConsentRepository;

  const content = {
    listSocialLinks: async () =>
      opts?.noLinks ? [] : [link('lnk-tt', 'tiktok'), link('lnk-ig', 'instagram')],
    markLinkAnalyzed: async (input: { id: string; status: string }) => {
      linkMarks.push({ id: input.id, status: input.status });
    },
    replaceContentItems: async (_creatorId: string, items: NewContentItemInput[]) => {
      savedItems = items;
      return items.map((it, i) => ({
        ...it,
        id: `item-${i}`,
        creatorProfileId: CREATOR.id,
      }));
    },
    saveInsight: async (input: NewContentInsightInput): Promise<CreatorContentInsight> => {
      savedInsight = input;
      return input;
    },
  } as unknown as CreatorContentRepository;

  const scraper: ContentScrapingProvider = {
    fetchProfile: async ({ network }) => {
      if (opts?.failNetworks?.includes(network)) throw new Error('scrape failed');
      return profileWith(network, network === 'tiktok' ? [1000, 500] : [300]);
    },
  };

  const transcriber: TranscriptionProvider = {
    transcribe: async () => ({
      text: 'Hoy cocinamos mamona llanera',
      language: 'es',
      durationSeconds: 30,
    }),
  };

  const analyzer: ContentAnalyzer = {
    analyze: async ({ items }) => ({
      suggestedCategories: ['gastronomia', 'turismo'],
      topTopics: ['mamona', 'llano'],
      audience: {
        primaryAgeRange: '25-34',
        topCities: ['Villavicencio'],
        languages: ['es'],
        interests: ['comida'],
      },
      brandSafety: 'safe' as const,
      itemTopics: items.map(() => ['mamona']),
    }),
  };

  const eventPub: EventPublisher = {
    publish: async (e) => {
      events.push(e);
    },
  };

  const clock: Clock = { now: () => NOW };

  return {
    deps: { creators, content, consents, scraper, transcriber, analyzer, events: eventPub, clock },
    captured: events,
    linkMarks,
    savedItems: () => savedItems,
    savedInsight: () => savedInsight,
  };
}

describe('analyzeCreatorContent', () => {
  it('raspa, transcribe, calcula métricas y guarda el insight', async () => {
    const t = makeDeps();
    const res = await analyzeCreatorContent(t.deps, { accountId: 'acc-1' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // 3 piezas: 2 de tiktok + 1 de instagram.
    expect(res.value.itemsAnalyzed).toBe(3);
    expect(res.value.totalViews).toBe(1800);
    expect(res.value.avgViews).toBe(600);
    expect(res.value.suggestedCategories).toContain('gastronomia');
    expect(res.value.status).toBe('completed');
    // Los videos se transcribieron.
    expect(t.savedItems().every((it) => it.transcript !== null)).toBe(true);
    // Temas por pieza asignados desde el clasificador.
    expect(t.savedItems()[0]?.topics).toEqual(['mamona']);
    // Ambos enlaces quedan verificados.
    expect(t.linkMarks).toEqual([
      { id: 'lnk-tt', status: 'verified' },
      { id: 'lnk-ig', status: 'verified' },
    ]);
    expect(t.captured[0]?.eventType).toBe('creator.content_analyzed');
  });

  it('exige consentimiento de análisis con IA', async () => {
    const t = makeDeps({ noConsent: true });
    const res = await analyzeCreatorContent(t.deps, { accountId: 'acc-1' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CONSENT_REQUIRED');
  });

  it('falla si la cuenta no es creador', async () => {
    const t = makeDeps({ missingCreator: true });
    const res = await analyzeCreatorContent(t.deps, { accountId: 'acc-1' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CREATOR_NOT_FOUND');
  });

  it('falla si no hay enlaces registrados', async () => {
    const t = makeDeps({ noLinks: true });
    const res = await analyzeCreatorContent(t.deps, { accountId: 'acc-1' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NO_SOCIAL_LINKS');
  });

  it('sigue con las demás redes si una falla, y marca esa como failed', async () => {
    const t = makeDeps({ failNetworks: ['tiktok'] });
    const res = await analyzeCreatorContent(t.deps, { accountId: 'acc-1' });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    // Solo la pieza de instagram (300 vistas).
    expect(res.value.itemsAnalyzed).toBe(1);
    expect(t.linkMarks).toContainEqual({ id: 'lnk-tt', status: 'failed' });
    expect(t.linkMarks).toContainEqual({ id: 'lnk-ig', status: 'verified' });
  });

  it('devuelve SCRAPING_FAILED si todas las redes fallan', async () => {
    const t = makeDeps({ failNetworks: ['tiktok', 'instagram'] });
    const res = await analyzeCreatorContent(t.deps, { accountId: 'acc-1' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('SCRAPING_FAILED');
  });
});
