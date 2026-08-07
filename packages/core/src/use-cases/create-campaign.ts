import type { CampaignModel, Money } from '@dejatellevar/contracts';
import type { Campaign } from '../entities.js';
import { type DomainError, domainError } from '../errors.js';
import type { Clock, EventPublisher, OrganizationRepository } from '../ports.js';
import type { CampaignRepository } from '../ports.js';
import { type Result, err, ok } from '../result.js';

/**
 * CREAR CAMPAÑA (brief) — §12, etapa 1. La empresa define una campaña para
 * contratar creadores. Publica domain_event (regla #5). La invitación a cada
 * creador es un paso aparte (ver invite-creator).
 */
export interface CreateCampaignDeps {
  organizations: OrganizationRepository;
  campaigns: CampaignRepository;
  events: EventPublisher;
  clock: Clock;
}

export interface CreateCampaignInput {
  organizationId: string;
  actorAccountId: string;
  name: string;
  model: CampaignModel;
  objective: string;
  targetAudience?: string | null;
  keyMessages?: string | null;
  doNotMention?: string | null;
  referenceUrls?: string[];
  serviceIds?: string[];
  targetCities?: string[];
  targetCategories?: string[];
  budgetTotal?: Money | null;
  feePerCreator?: Money | null;
  commissionRate?: number | null;
  contentLicense?: string;
  licenseDurationDays?: number | null;
  exclusivityDays?: number;
  applicationsCloseAt?: Date | null;
  contentDueAt?: Date | null;
}

export async function createCampaign(
  deps: CreateCampaignDeps,
  input: CreateCampaignInput,
): Promise<Result<Campaign, DomainError>> {
  const org = await deps.organizations.findById(input.organizationId);
  if (!org) {
    return err(domainError('ORGANIZATION_NOT_FOUND', 'La organización no existe'));
  }
  if (!org.isActive) {
    return err(domainError('NOT_AUTHORIZED', 'La organización no está activa'));
  }

  const code = await deps.campaigns.nextCode();
  const campaign = await deps.campaigns.create({
    organizationId: org.id,
    code,
    name: input.name,
    model: input.model,
    objective: input.objective,
    targetAudience: input.targetAudience ?? null,
    keyMessages: input.keyMessages ?? null,
    doNotMention: input.doNotMention ?? null,
    referenceUrls: input.referenceUrls ?? [],
    serviceIds: input.serviceIds ?? [],
    targetCities: input.targetCities ?? [],
    targetCategories: input.targetCategories ?? [],
    budgetTotal: input.budgetTotal ?? null,
    feePerCreator: input.feePerCreator ?? null,
    commissionRate: input.commissionRate ?? null,
    contentLicense: input.contentLicense ?? 'organic_only',
    licenseDurationDays: input.licenseDurationDays ?? null,
    exclusivityDays: input.exclusivityDays ?? 0,
    applicationsCloseAt: input.applicationsCloseAt ?? null,
    contentDueAt: input.contentDueAt ?? null,
  });

  await deps.events.publish({
    eventType: 'campaign.created',
    aggregateType: 'campaign',
    aggregateId: campaign.id,
    organizationId: org.id,
    actorAccountId: input.actorAccountId,
    payload: { code: campaign.code, name: campaign.name, model: campaign.model },
  });

  return ok(campaign);
}
