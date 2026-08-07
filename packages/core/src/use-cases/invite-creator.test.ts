import { money } from '@dejatellevar/contracts';
import { describe, expect, it } from 'vitest';
import type { Campaign, CampaignApplication, CreatorProfile } from '../entities.js';
import type {
  CampaignRepository,
  Clock,
  CreatorRepository,
  DomainEventInput,
  EventPublisher,
  NewApplicationInput,
} from '../ports.js';
import { inviteCreator } from './invite-creator.js';

const NOW = new Date('2026-08-07T10:00:00-05:00');
const clock: Clock = { now: () => NOW };

function campaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'cmp-1',
    organizationId: 'org-1',
    code: 'CMP-0001',
    name: 'Campaña',
    status: 'open',
    model: 'affiliate',
    objective: 'objetivo',
    targetAudience: null,
    keyMessages: null,
    doNotMention: null,
    referenceUrls: [],
    serviceIds: [],
    targetCities: [],
    targetCategories: [],
    budgetTotal: null,
    feePerCreator: null,
    commissionRate: 0.15,
    contentLicense: 'organic_only',
    exclusivityDays: 0,
    applicationsCloseAt: null,
    contentDueAt: null,
    totalReach: 0,
    attributedBookings: 0,
    attributedGmv: money(0),
    roas: null,
    createdAt: NOW,
    ...overrides,
  };
}

function creator(overrides: Partial<CreatorProfile> = {}): CreatorProfile {
  return {
    id: 'crt-1',
    accountId: 'acc-crt',
    handle: 'valentour',
    bio: null,
    categories: ['viajes'],
    cities: ['Bogotá'],
    languages: ['es'],
    isAcceptingWork: true,
    totalFollowers: 50000,
    avgEngagementRate: 0.05,
    fidelityIndex: 1.2,
    fidelitySampleSize: 8,
    conversionRate: 0.03,
    totalAttributedGmv: money(0),
    onTimeDeliveryRate: 0.98,
    avgRevisionRounds: 1.2,
    createdAt: NOW,
    ...overrides,
  };
}

function makeDeps(opts?: {
  campaign?: Campaign | null;
  creator?: CreatorProfile | null;
  existingApplication?: boolean;
}) {
  const events: DomainEventInput[] = [];
  const added: NewApplicationInput[] = [];

  const campaigns: CampaignRepository = {
    findById: async () => (opts?.campaign !== undefined ? opts.campaign : campaign()),
    nextCode: async () => 'CMP-0002',
    create: async () => {
      throw new Error('no usado');
    },
    findApplication: async () =>
      opts?.existingApplication ? ({ id: 'app-existing' } as CampaignApplication) : null,
    addApplication: async (input) => {
      added.push(input);
      return {
        id: 'app-1',
        campaignId: input.campaignId,
        creatorProfileId: input.creatorProfileId,
        status: 'submitted',
        isInvitation: input.isInvitation,
        pitch: input.pitch,
        proposedFee: input.proposedFee,
        matchScore: null,
        respondedAt: null,
        createdAt: NOW,
      };
    },
  };
  const creators: CreatorRepository = {
    findById: async () => (opts?.creator !== undefined ? opts.creator : creator()),
    findByHandle: async () => null,
    findByAccountId: async () => null,
    create: async () => {
      throw new Error('no usado en esta prueba');
    },
  };
  const eventPub: EventPublisher = {
    publish: async (e) => {
      events.push(e);
    },
  };

  return { campaigns, creators, events: eventPub, clock, captured: events, added };
}

const baseInput = {
  campaignId: 'cmp-1',
  organizationId: 'org-1',
  actorAccountId: 'acc-1',
  creatorProfileId: 'crt-1',
  pitch: '¿Te interesa mostrar nuestro tour?',
};

describe('inviteCreator', () => {
  it('crea la invitación y publica el evento', async () => {
    const deps = makeDeps();
    const res = await inviteCreator(deps, baseInput);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.isInvitation).toBe(true);
      expect(res.value.status).toBe('submitted');
    }
    expect(deps.added).toHaveLength(1);
    expect(deps.captured[0]?.eventType).toBe('campaign.creator_invited');
  });

  it('rechaza si la campaña no existe', async () => {
    const deps = makeDeps({ campaign: null });
    const res = await inviteCreator(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CAMPAIGN_NOT_FOUND');
  });

  it('rechaza si la campaña es de otra organización', async () => {
    const deps = makeDeps({ campaign: campaign({ organizationId: 'org-otra' }) });
    const res = await inviteCreator(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NOT_CAMPAIGN_OWNER');
  });

  it('rechaza si el creador no existe', async () => {
    const deps = makeDeps({ creator: null });
    const res = await inviteCreator(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CREATOR_NOT_FOUND');
  });

  it('rechaza si el creador no está recibiendo trabajos', async () => {
    const deps = makeDeps({ creator: creator({ isAcceptingWork: false }) });
    const res = await inviteCreator(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CREATOR_NOT_ACCEPTING');
  });

  it('rechaza una segunda invitación al mismo creador', async () => {
    const deps = makeDeps({ existingApplication: true });
    const res = await inviteCreator(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('ALREADY_INVITED');
    expect(deps.added).toHaveLength(0);
  });
});
