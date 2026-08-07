import { describe, expect, it } from 'vitest';
import type { CreatorProfile, CreatorSocialLink } from '../entities.js';
import type {
  ConsentRepository,
  CreatorContentRepository,
  CreatorRepository,
  DomainEventInput,
  EventPublisher,
  NewSocialLinkInput,
  PolicyVersionRepository,
} from '../ports.js';
import { connectSocialLinks, deriveHandle } from './connect-social-links.js';

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

function makeDeps(opts?: { missingCreator?: boolean; noPolicy?: boolean }) {
  const events: DomainEventInput[] = [];
  const consentsRecorded: { purpose: string; granted: boolean }[] = [];
  let savedLinks: NewSocialLinkInput[] = [];

  const creators = {
    findByAccountId: async () => (opts?.missingCreator ? null : CREATOR),
  } as unknown as CreatorRepository;

  const content = {
    replaceSocialLinks: async (creatorProfileId: string, links: NewSocialLinkInput[]) => {
      savedLinks = links;
      return links.map(
        (l, i): CreatorSocialLink => ({
          id: `lnk-${i}`,
          creatorProfileId,
          network: l.network,
          url: l.url,
          handle: l.handle,
          status: 'pending',
          lastAnalyzedAt: null,
        }),
      );
    },
  } as unknown as CreatorContentRepository;

  const policies = {
    latestFor: async (purpose: string) =>
      opts?.noPolicy
        ? null
        : { id: 'pol-ai', purpose, version: 'v1', contentUrl: '/legal/ai', contentHash: 'h' },
  } as unknown as PolicyVersionRepository;

  const consents = {
    record: async (input: { purpose: string; granted: boolean }) => {
      consentsRecorded.push({ purpose: input.purpose, granted: input.granted });
    },
  } as unknown as ConsentRepository;

  const eventPub: EventPublisher = {
    publish: async (e) => {
      events.push(e);
    },
  };

  return {
    deps: { creators, content, policies, consents, events: eventPub },
    captured: events,
    consentsRecorded,
    savedLinks: () => savedLinks,
  };
}

const input = {
  accountId: 'acc-1',
  socialLinks: [
    { network: 'tiktok', url: 'https://www.tiktok.com/@juanita.llano' },
    { network: 'instagram', url: 'https://instagram.com/juanita' },
  ],
  evidence: { ipAddress: '1.2.3.4', userAgent: 'jest' },
};

describe('deriveHandle', () => {
  it('extrae el handle del último segmento y quita la @', () => {
    expect(deriveHandle('https://www.tiktok.com/@juanita.llano')).toBe('juanita.llano');
    expect(deriveHandle('https://instagram.com/juanita/')).toBe('juanita');
  });
  it('devuelve null para URLs inválidas', () => {
    expect(deriveHandle('no-es-url')).toBeNull();
  });
});

describe('connectSocialLinks', () => {
  it('registra los enlaces, guarda el consentimiento de IA y publica el evento', async () => {
    const t = makeDeps();
    const res = await connectSocialLinks(t.deps, input);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value).toHaveLength(2);
    // Consentimiento ai_processing probatorio (Ley 1581).
    expect(t.consentsRecorded).toContainEqual({ purpose: 'ai_processing', granted: true });
    // Handle derivado de la URL.
    expect(t.savedLinks()[0]?.handle).toBe('juanita.llano');
    expect(t.captured[0]?.eventType).toBe('creator.social_links_connected');
  });

  it('rechaza si la cuenta no tiene perfil de creador', async () => {
    const t = makeDeps({ missingCreator: true });
    const res = await connectSocialLinks(t.deps, input);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CREATOR_NOT_FOUND');
  });

  it('rechaza si no hay enlaces', async () => {
    const t = makeDeps();
    const res = await connectSocialLinks(t.deps, { ...input, socialLinks: [] });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NO_SOCIAL_LINKS');
  });

  it('rechaza si la política de IA no está publicada', async () => {
    const t = makeDeps({ noPolicy: true });
    const res = await connectSocialLinks(t.deps, input);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('POLICY_NOT_CONFIGURED');
  });
});
