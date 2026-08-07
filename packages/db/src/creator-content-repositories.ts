import type {
  CreatorContentInsight,
  CreatorContentItem,
  CreatorContentRepository,
  CreatorSocialLink,
  NewContentInsightInput,
  NewContentItemInput,
  NewSocialLinkInput,
} from '@dejatellevar/core';
import { eq } from 'drizzle-orm';
import type { DbClient } from './client.js';
import * as s from './schema.js';

type Network = (typeof s.socialNetwork.enumValues)[number];
type ContentKind = (typeof s.socialContentKind.enumValues)[number];
type AnalysisStatus = (typeof s.creatorAnalysisStatus.enumValues)[number];

type InsightAudience = CreatorContentInsight['audience'];
type NetworkSummary = CreatorContentInsight['networks'][number];

function num(v: string | null): number | null {
  return v === null ? null : Number(v);
}

function mapLink(r: typeof s.creatorSocialLink.$inferSelect): CreatorSocialLink {
  return {
    id: r.id,
    creatorProfileId: r.creatorProfileId,
    network: r.network,
    url: r.url,
    handle: r.handle,
    status: r.status,
    lastAnalyzedAt: r.lastAnalyzedAt,
  };
}

function mapItem(r: typeof s.creatorContentItem.$inferSelect): CreatorContentItem {
  return {
    id: r.id,
    creatorProfileId: r.creatorProfileId,
    network: r.network,
    kind: r.kind,
    externalId: r.externalId,
    url: r.url,
    title: r.title,
    views: r.views,
    likes: r.likes,
    comments: r.comments,
    shares: r.shares,
    durationSeconds: r.durationSeconds,
    publishedAt: r.publishedAt,
    transcript: r.transcript,
    language: r.language,
    topics: r.topics,
    analyzedAt: r.analyzedAt,
  };
}

function mapInsight(r: typeof s.creatorContentInsight.$inferSelect): CreatorContentInsight {
  return {
    creatorProfileId: r.creatorProfileId,
    status: r.status,
    itemsAnalyzed: r.itemsAnalyzed,
    totalViews: r.totalViews,
    avgViews: Number(r.avgViews),
    avgEngagementRate: num(r.avgEngagementRate),
    suggestedCategories: r.suggestedCategories,
    topTopics: r.topTopics,
    audience: r.audience as InsightAudience,
    brandSafety: r.brandSafety as CreatorContentInsight['brandSafety'],
    networks: r.networks as NetworkSummary[],
    analyzedAt: r.analyzedAt,
  };
}

export function makeCreatorContentRepository(db: DbClient): CreatorContentRepository {
  return {
    async listSocialLinks(creatorProfileId) {
      const rows = await db
        .select()
        .from(s.creatorSocialLink)
        .where(eq(s.creatorSocialLink.creatorProfileId, creatorProfileId));
      return rows.map(mapLink);
    },

    async replaceSocialLinks(creatorProfileId, links: NewSocialLinkInput[]) {
      return db.transaction(async (tx) => {
        await tx
          .delete(s.creatorSocialLink)
          .where(eq(s.creatorSocialLink.creatorProfileId, creatorProfileId));
        if (links.length === 0) return [];
        const inserted = await tx
          .insert(s.creatorSocialLink)
          .values(
            links.map((l) => ({
              creatorProfileId,
              network: l.network as Network,
              url: l.url,
              handle: l.handle,
            })),
          )
          .returning();
        return inserted.map(mapLink);
      });
    },

    async markLinkAnalyzed({ id, status, at }) {
      await db
        .update(s.creatorSocialLink)
        .set({ status, lastAnalyzedAt: at, updatedAt: new Date() })
        .where(eq(s.creatorSocialLink.id, id));
    },

    async replaceContentItems(creatorProfileId, items: NewContentItemInput[]) {
      return db.transaction(async (tx) => {
        await tx
          .delete(s.creatorContentItem)
          .where(eq(s.creatorContentItem.creatorProfileId, creatorProfileId));
        if (items.length === 0) return [];
        const inserted = await tx
          .insert(s.creatorContentItem)
          .values(
            items.map((it) => ({
              creatorProfileId,
              network: it.network as Network,
              kind: it.kind as ContentKind,
              externalId: it.externalId,
              url: it.url,
              title: it.title,
              views: it.views,
              likes: it.likes,
              comments: it.comments,
              shares: it.shares,
              durationSeconds: it.durationSeconds,
              publishedAt: it.publishedAt,
              transcript: it.transcript,
              language: it.language,
              topics: it.topics,
              analyzedAt: it.analyzedAt,
            })),
          )
          .returning();
        return inserted.map(mapItem);
      });
    },

    async listContentItems(creatorProfileId) {
      const rows = await db
        .select()
        .from(s.creatorContentItem)
        .where(eq(s.creatorContentItem.creatorProfileId, creatorProfileId));
      return rows.map(mapItem);
    },

    async saveInsight(input: NewContentInsightInput) {
      const values = {
        creatorProfileId: input.creatorProfileId,
        status: input.status as AnalysisStatus,
        itemsAnalyzed: input.itemsAnalyzed,
        totalViews: input.totalViews,
        avgViews: String(input.avgViews),
        avgEngagementRate:
          input.avgEngagementRate === null ? null : String(input.avgEngagementRate),
        suggestedCategories: input.suggestedCategories,
        topTopics: input.topTopics,
        audience: input.audience,
        brandSafety: input.brandSafety,
        networks: input.networks,
        analyzedAt: input.analyzedAt,
        updatedAt: new Date(),
      };
      const inserted = await db
        .insert(s.creatorContentInsight)
        .values(values)
        .onConflictDoUpdate({ target: s.creatorContentInsight.creatorProfileId, set: values })
        .returning();
      return mapInsight(inserted[0]!);
    },

    async getInsight(creatorProfileId) {
      const rows = await db
        .select()
        .from(s.creatorContentInsight)
        .where(eq(s.creatorContentInsight.creatorProfileId, creatorProfileId))
        .limit(1);
      return rows[0] ? mapInsight(rows[0]) : null;
    },
  };
}
