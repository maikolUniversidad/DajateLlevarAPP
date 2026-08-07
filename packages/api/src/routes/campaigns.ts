import { CreateCampaignSchema, InviteCreatorSchema } from '@dejatellevar/contracts';
import type { Campaign, CampaignApplication } from '@dejatellevar/core';
import { createCampaign, inviteCreator } from '@dejatellevar/core';
import {
  makeCampaignQueries,
  makeCampaignRepository,
  makeCreatorRepository,
  makeEventPublisher,
  makeOrganizationRepository,
  systemClock,
} from '@dejatellevar/db';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';
import { domainStatus, errorResponse } from '../errors.js';
import { requireAuth } from '../middleware.js';

function toCampaign(c: Campaign) {
  return {
    id: c.id,
    organization_id: c.organizationId,
    code: c.code,
    name: c.name,
    status: c.status,
    model: c.model,
    objective: c.objective,
    target_audience: c.targetAudience,
    key_messages: c.keyMessages,
    do_not_mention: c.doNotMention,
    reference_urls: c.referenceUrls,
    service_ids: c.serviceIds,
    target_cities: c.targetCities,
    target_categories: c.targetCategories,
    budget_total: c.budgetTotal,
    fee_per_creator: c.feePerCreator,
    commission_rate: c.commissionRate,
    content_license: c.contentLicense,
    exclusivity_days: c.exclusivityDays,
    applications_close_at: c.applicationsCloseAt ? c.applicationsCloseAt.toISOString() : null,
    content_due_at: c.contentDueAt ? c.contentDueAt.toISOString() : null,
    total_reach: c.totalReach,
    attributed_bookings: c.attributedBookings,
    attributed_gmv: c.attributedGmv,
    roas: c.roas,
    created_at: c.createdAt.toISOString(),
  };
}

function toApplication(a: CampaignApplication) {
  return {
    id: a.id,
    campaign_id: a.campaignId,
    creator_profile_id: a.creatorProfileId,
    status: a.status,
    is_invitation: a.isInvitation,
    pitch: a.pitch,
    proposed_fee: a.proposedFee,
    match_score: a.matchScore,
    responded_at: a.respondedAt ? a.respondedAt.toISOString() : null,
    created_at: a.createdAt.toISOString(),
  };
}

/**
 * Contratación de creadores desde la empresa (§12): la empresa crea una campaña
 * (brief) y le solicita una propuesta a un creador (invitación). Todo va con la
 * organización del contexto (encabezado x-organization-id).
 */
export function campaignsRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;
  const campaigns = makeCampaignRepository(db);
  const campaignQueries = makeCampaignQueries(db);
  const creators = makeCreatorRepository(db);
  const organizations = makeOrganizationRepository(db);
  const events = makeEventPublisher(db);

  app.use('*', requireAuth);

  // GET /v1/campaigns — campañas de la organización del contexto.
  app.get('/', async (c) => {
    const organizationId = c.get('organizationId');
    if (!organizationId) {
      return errorResponse(c, 400, 'NO_ORG_CONTEXT', 'Falta la organización (x-organization-id).');
    }
    const list = await campaignQueries.listByOrganization(organizationId);
    return c.json({ data: list.map(toCampaign) });
  });

  // POST /v1/campaigns — crear campaña (brief).
  app.post('/', async (c) => {
    const accountId = c.get('accountId');
    const organizationId = c.get('organizationId');
    if (!accountId || !organizationId) {
      return errorResponse(c, 400, 'NO_ORG_CONTEXT', 'Falta la organización (x-organization-id).');
    }
    const body = CreateCampaignSchema.parse(await c.req.json());
    if (body.organization_id !== organizationId) {
      return errorResponse(
        c,
        403,
        'NOT_AUTHORIZED',
        'La organización no coincide con tu contexto.',
      );
    }

    const result = await createCampaign(
      { organizations, campaigns, events, clock: systemClock },
      {
        organizationId,
        actorAccountId: accountId,
        name: body.name,
        model: body.model,
        objective: body.objective,
        targetAudience: body.target_audience ?? null,
        keyMessages: body.key_messages ?? null,
        doNotMention: body.do_not_mention ?? null,
        referenceUrls: body.reference_urls,
        serviceIds: body.service_ids,
        targetCities: body.target_cities,
        targetCategories: body.target_categories,
        budgetTotal: body.budget_total ?? null,
        feePerCreator: body.fee_per_creator ?? null,
        commissionRate: body.commission_rate ?? null,
        contentLicense: body.content_license,
        licenseDurationDays: body.license_duration_days ?? null,
        exclusivityDays: body.exclusivity_days,
        applicationsCloseAt: body.applications_close_at
          ? new Date(body.applications_close_at)
          : null,
        contentDueAt: body.content_due_at ? new Date(body.content_due_at) : null,
      },
    );
    if (!result.ok) {
      return errorResponse(
        c,
        domainStatus(result.error.code),
        result.error.code,
        result.error.message,
      );
    }
    return c.json(toCampaign(result.value), 201);
  });

  // POST /v1/campaigns/:id/invite — solicitar propuesta a un creador.
  app.post('/:id/invite', async (c) => {
    const accountId = c.get('accountId');
    const organizationId = c.get('organizationId');
    if (!accountId || !organizationId) {
      return errorResponse(c, 400, 'NO_ORG_CONTEXT', 'Falta la organización (x-organization-id).');
    }
    const body = InviteCreatorSchema.parse(await c.req.json());

    const result = await inviteCreator(
      { campaigns, creators, events, clock: systemClock },
      {
        campaignId: c.req.param('id'),
        organizationId,
        actorAccountId: accountId,
        creatorProfileId: body.creator_profile_id,
        pitch: body.pitch ?? null,
        proposedFee: body.proposed_fee ?? null,
      },
    );
    if (!result.ok) {
      return errorResponse(
        c,
        domainStatus(result.error.code),
        result.error.code,
        result.error.message,
      );
    }
    return c.json(toApplication(result.value), 201);
  });

  return app;
}
