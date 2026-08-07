import type {
  CreatorProfile,
  CreatorRepository,
  Membership,
  MembershipRepository,
  MembershipView,
} from '@dejatellevar/core';
import { and, eq, isNull } from 'drizzle-orm';
import type { DbClient } from './client.js';
import * as s from './schema.js';

function num(v: string | null): number | null {
  return v === null ? null : Number(v);
}

function mapCreator(r: typeof s.creatorProfile.$inferSelect): CreatorProfile {
  return {
    id: r.id,
    accountId: r.accountId,
    handle: r.handle,
    bio: r.bio,
    categories: r.categories,
    cities: r.cities,
    languages: r.languages,
    isAcceptingWork: r.isAcceptingWork,
    totalFollowers: r.totalFollowers,
    avgEngagementRate: num(r.avgEngagementRate),
    fidelityIndex: num(r.fidelityIndex),
    fidelitySampleSize: r.fidelitySampleSize,
    conversionRate: num(r.conversionRate),
    totalAttributedGmv: { amount: r.totalAttributedGmv, currency: 'COP' },
    onTimeDeliveryRate: num(r.onTimeDeliveryRate),
    avgRevisionRounds: num(r.avgRevisionRounds),
    createdAt: r.createdAt,
  };
}

export function makeCreatorRepository(db: DbClient): CreatorRepository {
  return {
    async findById(id): Promise<CreatorProfile | null> {
      const rows = await db
        .select()
        .from(s.creatorProfile)
        .where(eq(s.creatorProfile.id, id))
        .limit(1);
      return rows[0] ? mapCreator(rows[0]) : null;
    },
    async findByHandle(handle): Promise<CreatorProfile | null> {
      const rows = await db
        .select()
        .from(s.creatorProfile)
        .where(eq(s.creatorProfile.handle, handle))
        .limit(1);
      return rows[0] ? mapCreator(rows[0]) : null;
    },
    async findByAccountId(accountId): Promise<CreatorProfile | null> {
      const rows = await db
        .select()
        .from(s.creatorProfile)
        .where(eq(s.creatorProfile.accountId, accountId))
        .limit(1);
      return rows[0] ? mapCreator(rows[0]) : null;
    },
    async create(input): Promise<CreatorProfile> {
      const inserted = await db
        .insert(s.creatorProfile)
        .values({
          accountId: input.accountId,
          handle: input.handle,
          bio: input.bio ?? null,
          categories: input.categories,
          cities: input.cities,
        })
        .returning();
      return mapCreator(inserted[0]!);
    },
  };
}

export function makeMembershipRepository(db: DbClient): MembershipRepository {
  return {
    async create({ organizationId, accountId, role }): Promise<Membership> {
      const inserted = await db
        .insert(s.organizationMembership)
        .values({ organizationId, accountId, role, acceptedAt: new Date() })
        .returning();
      const r = inserted[0]!;
      return {
        id: r.id,
        organizationId: r.organizationId,
        accountId: r.accountId,
        role: r.role,
        createdAt: r.createdAt,
      };
    },
    async findByAccountId(accountId): Promise<MembershipView[]> {
      const rows = await db
        .select({
          organizationId: s.organizationMembership.organizationId,
          tradeName: s.organization.tradeName,
          role: s.organizationMembership.role,
        })
        .from(s.organizationMembership)
        .innerJoin(s.organization, eq(s.organization.id, s.organizationMembership.organizationId))
        .where(
          and(
            eq(s.organizationMembership.accountId, accountId),
            isNull(s.organizationMembership.deletedAt),
          ),
        );
      return rows.map((r) => ({
        organizationId: r.organizationId,
        tradeName: r.tradeName,
        role: r.role,
      }));
    },
  };
}
