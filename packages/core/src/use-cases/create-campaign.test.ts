import { money } from '@dejatellevar/contracts';
import { describe, expect, it } from 'vitest';
import type { Campaign, Organization } from '../entities.js';
import type {
  CampaignRepository,
  Clock,
  DomainEventInput,
  EventPublisher,
  NewCampaignInput,
  OrganizationRepository,
} from '../ports.js';
import { createCampaign } from './create-campaign.js';

const NOW = new Date('2026-08-07T10:00:00-05:00');
const clock: Clock = { now: () => NOW };

function org(overrides: Partial<Organization> = {}): Organization {
  return {
    id: 'org-1',
    slug: 'acme',
    legalName: 'Acme SAS',
    tradeName: 'Acme',
    taxId: '900123456',
    taxIdVerifiedAt: null,
    tourismRegistry: null,
    tourismRegistryValidUntil: null,
    commissionRate: 0.12,
    isActive: true,
    ...overrides,
  };
}

function toCampaign(input: NewCampaignInput): Campaign {
  return {
    id: 'cmp-1',
    organizationId: input.organizationId,
    code: input.code,
    name: input.name,
    status: 'draft',
    model: input.model,
    objective: input.objective,
    targetAudience: input.targetAudience,
    keyMessages: input.keyMessages,
    doNotMention: input.doNotMention,
    referenceUrls: input.referenceUrls,
    serviceIds: input.serviceIds,
    targetCities: input.targetCities,
    targetCategories: input.targetCategories,
    budgetTotal: input.budgetTotal,
    feePerCreator: input.feePerCreator,
    commissionRate: input.commissionRate,
    contentLicense: input.contentLicense,
    exclusivityDays: input.exclusivityDays,
    applicationsCloseAt: input.applicationsCloseAt,
    contentDueAt: input.contentDueAt,
    totalReach: 0,
    attributedBookings: 0,
    attributedGmv: money(0),
    roas: null,
    createdAt: NOW,
  };
}

function makeDeps(opts?: { org?: Organization | null }) {
  const events: DomainEventInput[] = [];
  const created: NewCampaignInput[] = [];

  const organizations: OrganizationRepository = {
    findById: async (id) => (opts?.org !== undefined ? opts.org : org({ id })),
    existsByTaxId: async () => false,
    create: async () => {
      throw new Error('no usado en esta prueba');
    },
  };
  const campaigns: CampaignRepository = {
    findById: async () => null,
    nextCode: async () => 'CMP-0001',
    create: async (input) => {
      created.push(input);
      return toCampaign(input);
    },
    findApplication: async () => null,
    addApplication: async () => {
      throw new Error('no usado en este caso');
    },
  };
  const eventPub: EventPublisher = {
    publish: async (e) => {
      events.push(e);
    },
  };

  return { organizations, campaigns, events: eventPub, clock, captured: events, created };
}

const baseInput = {
  organizationId: 'org-1',
  actorAccountId: 'acc-1',
  name: 'Lanzamiento tour de café',
  model: 'affiliate' as const,
  objective: 'Dar a conocer el tour de café a viajeros jóvenes de Bogotá',
  commissionRate: 0.15,
};

describe('createCampaign', () => {
  it('crea la campaña con código y publica el evento', async () => {
    const deps = makeDeps();
    const res = await createCampaign(deps, baseInput);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.code).toBe('CMP-0001');
      expect(res.value.status).toBe('draft');
    }
    expect(deps.captured[0]?.eventType).toBe('campaign.created');
    expect(deps.captured[0]?.aggregateType).toBe('campaign');
  });

  it('rechaza si la organización no existe', async () => {
    const deps = makeDeps({ org: null });
    const res = await createCampaign(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('ORGANIZATION_NOT_FOUND');
    expect(deps.captured).toHaveLength(0);
  });

  it('rechaza si la organización está inactiva', async () => {
    const deps = makeDeps({ org: org({ isActive: false }) });
    const res = await createCampaign(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NOT_AUTHORIZED');
  });
});
