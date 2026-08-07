import type { Money } from '@dejatellevar/contracts';
import type { CampaignApplication } from '../entities.js';
import { type DomainError, domainError } from '../errors.js';
import type { CampaignRepository, Clock, CreatorRepository, EventPublisher } from '../ports.js';
import { type Result, err, ok } from '../result.js';

/**
 * INVITAR CREADOR — §12, etapa 3. La empresa pide una propuesta a un creador
 * concreto: crea una campaign_application con is_invitation=true. Idempotente
 * por (campaña, creador): una segunda invitación devuelve ALREADY_INVITED.
 */
export interface InviteCreatorDeps {
  campaigns: CampaignRepository;
  creators: CreatorRepository;
  events: EventPublisher;
  clock: Clock;
}

export interface InviteCreatorInput {
  campaignId: string;
  /** Organización que actúa; debe ser dueña de la campaña. */
  organizationId: string;
  actorAccountId: string;
  creatorProfileId: string;
  pitch?: string | null;
  proposedFee?: Money | null;
}

export async function inviteCreator(
  deps: InviteCreatorDeps,
  input: InviteCreatorInput,
): Promise<Result<CampaignApplication, DomainError>> {
  const campaign = await deps.campaigns.findById(input.campaignId);
  if (!campaign) {
    return err(domainError('CAMPAIGN_NOT_FOUND', 'La campaña no existe'));
  }
  if (campaign.organizationId !== input.organizationId) {
    return err(domainError('NOT_CAMPAIGN_OWNER', 'La campaña no pertenece a tu organización'));
  }

  const creator = await deps.creators.findById(input.creatorProfileId);
  if (!creator) {
    return err(domainError('CREATOR_NOT_FOUND', 'El creador no existe'));
  }
  if (!creator.isAcceptingWork) {
    return err(domainError('CREATOR_NOT_ACCEPTING', 'El creador no está recibiendo trabajos'));
  }

  const existing = await deps.campaigns.findApplication(campaign.id, creator.id);
  if (existing) {
    return err(domainError('ALREADY_INVITED', 'Ya existe una solicitud para este creador'));
  }

  const application = await deps.campaigns.addApplication({
    campaignId: campaign.id,
    creatorProfileId: creator.id,
    isInvitation: true,
    pitch: input.pitch ?? null,
    proposedFee: input.proposedFee ?? null,
  });

  await deps.events.publish({
    eventType: 'campaign.creator_invited',
    aggregateType: 'campaign',
    aggregateId: campaign.id,
    organizationId: campaign.organizationId,
    actorAccountId: input.actorAccountId,
    payload: { creatorProfileId: creator.id, applicationId: application.id },
  });

  return ok(application);
}
