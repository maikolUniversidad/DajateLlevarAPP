import type { Campaign, CampaignApplication, CampaignRepository } from '@dejatellevar/core';
import { and, desc, eq } from 'drizzle-orm';
import type { DbClient } from './client.js';
import * as s from './schema.js';

function num(v: string | null): number | null {
  return v === null ? null : Number(v);
}

function money(amount: number | null) {
  return amount === null ? null : { amount, currency: 'COP' as const };
}

function mapCampaign(r: typeof s.campaign.$inferSelect): Campaign {
  return {
    id: r.id,
    organizationId: r.organizationId,
    code: r.code,
    name: r.name,
    status: r.status,
    model: r.model,
    objective: r.objective,
    targetAudience: r.targetAudience,
    keyMessages: r.keyMessages,
    doNotMention: r.doNotMention,
    referenceUrls: r.referenceUrls ?? [],
    serviceIds: r.serviceIds,
    targetCities: r.targetCities ?? [],
    targetCategories: r.targetCategories ?? [],
    budgetTotal: money(r.budgetTotal),
    feePerCreator: money(r.feePerCreator),
    commissionRate: num(r.commissionRate),
    contentLicense: r.contentLicense,
    exclusivityDays: r.exclusivityDays,
    applicationsCloseAt: r.applicationsCloseAt,
    contentDueAt: r.contentDueAt,
    totalReach: r.totalReach,
    attributedBookings: r.attributedBookings,
    attributedGmv: { amount: r.attributedGmv, currency: 'COP' },
    roas: num(r.roas),
    createdAt: r.createdAt,
  };
}

function mapApplication(r: typeof s.campaignApplication.$inferSelect): CampaignApplication {
  return {
    id: r.id,
    campaignId: r.campaignId,
    creatorProfileId: r.creatorProfileId,
    status: r.status,
    isInvitation: r.isInvitation,
    pitch: r.pitch,
    proposedFee: money(r.proposedFee),
    matchScore: num(r.matchScore),
    respondedAt: r.respondedAt,
    createdAt: r.createdAt,
  };
}

/** Código legible y único de campaña: `CMP-` + 8 hex (12 chars, cabe en varchar(12)). */
function nextCampaignCode(): string {
  return `CMP-${crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase()}`;
}

export function makeCampaignRepository(db: DbClient): CampaignRepository {
  return {
    async findById(id): Promise<Campaign | null> {
      const rows = await db.select().from(s.campaign).where(eq(s.campaign.id, id)).limit(1);
      return rows[0] ? mapCampaign(rows[0]) : null;
    },
    async nextCode(): Promise<string> {
      return nextCampaignCode();
    },
    async create(input): Promise<Campaign> {
      const inserted = await db
        .insert(s.campaign)
        .values({
          organizationId: input.organizationId,
          code: input.code,
          name: input.name,
          model: input.model,
          objective: input.objective,
          targetAudience: input.targetAudience,
          keyMessages: input.keyMessages,
          doNotMention: input.doNotMention,
          referenceUrls: input.referenceUrls,
          serviceIds: input.serviceIds,
          targetCities: input.targetCities,
          targetCategories: input.targetCategories,
          budgetTotal: input.budgetTotal?.amount ?? null,
          feePerCreator: input.feePerCreator?.amount ?? null,
          commissionRate: input.commissionRate === null ? null : String(input.commissionRate),
          contentLicense: input.contentLicense,
          licenseDurationDays: input.licenseDurationDays,
          exclusivityDays: input.exclusivityDays,
          applicationsCloseAt: input.applicationsCloseAt,
          contentDueAt: input.contentDueAt,
        })
        .returning();
      return mapCampaign(inserted[0]!);
    },
    async findApplication(campaignId, creatorProfileId): Promise<CampaignApplication | null> {
      const rows = await db
        .select()
        .from(s.campaignApplication)
        .where(
          and(
            eq(s.campaignApplication.campaignId, campaignId),
            eq(s.campaignApplication.creatorProfileId, creatorProfileId),
          ),
        )
        .limit(1);
      return rows[0] ? mapApplication(rows[0]) : null;
    },
    async addApplication(input): Promise<CampaignApplication> {
      const inserted = await db
        .insert(s.campaignApplication)
        .values({
          campaignId: input.campaignId,
          creatorProfileId: input.creatorProfileId,
          isInvitation: input.isInvitation,
          pitch: input.pitch,
          proposedFee: input.proposedFee?.amount ?? null,
        })
        .returning();
      return mapApplication(inserted[0]!);
    },
  };
}

/** Lista las campañas de una organización (para el panel de la empresa). */
export function makeCampaignQueries(db: DbClient) {
  return {
    async listByOrganization(organizationId: string): Promise<Campaign[]> {
      const rows = await db
        .select()
        .from(s.campaign)
        .where(eq(s.campaign.organizationId, organizationId))
        .orderBy(desc(s.campaign.createdAt))
        .limit(100);
      return rows.map(mapCampaign);
    },
  };
}
