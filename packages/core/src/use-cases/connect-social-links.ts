import type { CreatorSocialLink } from '../entities.js';
import { type DomainError, domainError } from '../errors.js';
import type {
  ConsentEvidence,
  ConsentRepository,
  CreatorContentRepository,
  CreatorRepository,
  EventPublisher,
  PolicyVersionRepository,
} from '../ports.js';
import { type Result, err, ok } from '../result.js';

export interface ConnectSocialLinksInput {
  accountId: string;
  /** Enlaces públicos a las redes del creador. Entrada del scraping. */
  socialLinks: { network: string; url: string }[];
  /** Prueba del consentimiento de análisis con IA (Ley 1581): IP y user agent. */
  evidence: ConsentEvidence;
}

export interface ConnectSocialLinksDeps {
  creators: CreatorRepository;
  content: CreatorContentRepository;
  policies: PolicyVersionRepository;
  consents: ConsentRepository;
  events: EventPublisher;
}

/**
 * Deriva un handle legible del último segmento significativo de la URL.
 * Ej.: https://tiktok.com/@juanita → "juanita". Es una PISTA; el scraping
 * confirma luego el handle real de la red.
 */
export function deriveHandle(url: string): string | null {
  try {
    const u = new URL(url);
    const segments = u.pathname.split('/').filter(Boolean);
    const last = segments.at(-1);
    if (!last) return null;
    return last.replace(/^@/, '').slice(0, 120) || null;
  } catch {
    return null;
  }
}

/**
 * ConnectSocialLinks — el creador registra los enlaces de sus redes para que la
 * plataforma pueda analizar su contenido (§12).
 *
 * Invariantes:
 *  - La cuenta debe tener perfil de creador activo.
 *  - Al menos un enlace.
 *  - Transcribir y clasificar el contenido es tratamiento con IA de datos
 *    personales: exige consentimiento `ai_processing` probatorio (Ley 1581), que
 *    se registra con versión de política, IP y user agent. Un booleano no basta.
 *  - Los enlaces son idempotentes por red (se reemplaza el conjunto).
 */
export async function connectSocialLinks(
  deps: ConnectSocialLinksDeps,
  input: ConnectSocialLinksInput,
): Promise<Result<CreatorSocialLink[], DomainError>> {
  const { creators, content, policies, consents, events } = deps;

  const creator = await creators.findByAccountId(input.accountId);
  if (!creator) {
    return err(domainError('CREATOR_NOT_FOUND', 'Primero activa tu perfil de creador'));
  }

  if (input.socialLinks.length === 0) {
    return err(domainError('NO_SOCIAL_LINKS', 'Agrega al menos un enlace de red social'));
  }

  // Consentimiento de análisis con IA: la política debe estar publicada (§6).
  const aiPolicy = await policies.latestFor('ai_processing');
  if (!aiPolicy) {
    return err(
      domainError('POLICY_NOT_CONFIGURED', 'La política de tratamiento con IA no está publicada'),
    );
  }
  await consents.record({
    accountId: input.accountId,
    policyVersionId: aiPolicy.id,
    purpose: 'ai_processing',
    granted: true,
    evidence: input.evidence,
  });

  const links = await content.replaceSocialLinks(
    creator.id,
    input.socialLinks.map((l) => ({
      network: l.network,
      url: l.url,
      handle: deriveHandle(l.url),
    })),
  );

  await events.publish({
    eventType: 'creator.social_links_connected',
    aggregateType: 'creator_profile',
    aggregateId: creator.id,
    actorAccountId: input.accountId,
    payload: { networks: links.map((l) => l.network) },
  });

  return ok(links);
}
