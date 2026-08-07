import type {
  Account,
  AccountRepository,
  ConsentPurpose,
  ConsentRepository,
  ConsentState,
  DataSubjectRequestRepository,
  PolicyVersion,
  PolicyVersionRepository,
} from '@dejatellevar/core';
import { and, desc, sql as dsql, eq, isNull } from 'drizzle-orm';
import type { DbClient } from './client.js';
import * as s from './schema.js';

function mapAccount(r: typeof s.account.$inferSelect): Account {
  return {
    id: r.id,
    email: r.email,
    emailVerifiedAt: r.emailVerifiedAt,
    phone: r.phone,
    phoneVerifiedAt: r.phoneVerifiedAt,
    fullName: r.fullName,
    documentType: r.documentType,
    documentNumber: r.documentNumber,
    documentVerifiedAt: r.documentVerifiedAt,
  };
}

export function makeAccountRepository(db: DbClient): AccountRepository {
  return {
    async findById(id) {
      const rows = await db
        .select()
        .from(s.account)
        .where(and(eq(s.account.id, id), isNull(s.account.deletedAt)))
        .limit(1);
      return rows[0] ? mapAccount(rows[0]) : null;
    },
    async findByExternalAuthId(externalAuthId) {
      const rows = await db
        .select()
        .from(s.account)
        .where(and(eq(s.account.externalAuthId, externalAuthId), isNull(s.account.deletedAt)))
        .limit(1);
      return rows[0] ? mapAccount(rows[0]) : null;
    },
    async findByEmail(email) {
      const rows = await db
        .select()
        .from(s.account)
        .where(and(eq(s.account.email, email), isNull(s.account.deletedAt)))
        .limit(1);
      return rows[0] ? mapAccount(rows[0]) : null;
    },
    async create(input) {
      return db.transaction(async (tx) => {
        const inserted = await tx
          .insert(s.account)
          .values({
            email: input.email,
            fullName: input.fullName,
            phone: input.phone ?? null,
            externalAuthId: input.externalAuthId,
          })
          .returning();
        const account = inserted[0]!;
        // El perfil de cliente siempre existe (§4.1).
        await tx.insert(s.clientProfile).values({ accountId: account.id });
        return mapAccount(account);
      });
    },
    async update(id, patch) {
      const updated = await db
        .update(s.account)
        .set({
          ...(patch.fullName !== undefined ? { fullName: patch.fullName } : {}),
          ...(patch.displayName !== undefined ? { displayName: patch.displayName } : {}),
          ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
          ...(patch.city !== undefined ? { city: patch.city } : {}),
          ...(patch.department !== undefined ? { department: patch.department } : {}),
          updatedAt: new Date(),
        })
        .where(eq(s.account.id, id))
        .returning();
      return mapAccount(updated[0]!);
    },
    async softDelete(id) {
      await db.update(s.account).set({ deletedAt: new Date() }).where(eq(s.account.id, id));
    },
  };
}

export function makePolicyVersionRepository(db: DbClient): PolicyVersionRepository {
  return {
    async latestFor(purpose): Promise<PolicyVersion | null> {
      const rows = await db
        .select()
        .from(s.policyVersion)
        .where(eq(s.policyVersion.purpose, purpose))
        .orderBy(desc(s.policyVersion.effectiveFrom))
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      return {
        id: r.id,
        purpose: r.purpose as ConsentPurpose,
        version: r.version,
        contentUrl: r.contentUrl,
        contentHash: r.contentHash,
      };
    },
  };
}

export function makeConsentRepository(db: DbClient): ConsentRepository {
  return {
    async record({ accountId, policyVersionId, purpose, granted, evidence }) {
      await db.insert(s.consent).values({
        accountId,
        policyVersionId,
        purpose,
        granted,
        revokedAt: granted ? null : new Date(),
        ipAddress: evidence.ipAddress ?? null,
        userAgent: evidence.userAgent ?? null,
      });
    },
    async currentFor(accountId): Promise<ConsentState[]> {
      // Último asiento por propósito, con la versión de política asociada.
      const rows = await db.execute(dsql`
        SELECT DISTINCT ON (c.purpose)
          c.purpose, c.granted, c.granted_at, c.revoked_at, pv.version
        FROM consent c
        JOIN policy_version pv ON pv.id = c.policy_version_id
        WHERE c.account_id = ${accountId}
        ORDER BY c.purpose, c.granted_at DESC
      `);
      return (rows as unknown as Array<Record<string, unknown>>).map((r) => ({
        purpose: r.purpose as ConsentPurpose,
        granted: r.granted as boolean,
        grantedAt: r.granted_at ? new Date(r.granted_at as string) : null,
        revokedAt: r.revoked_at ? new Date(r.revoked_at as string) : null,
        policyVersion: r.version as string,
      }));
    },
  };
}

export function makeDataSubjectRequestRepository(db: DbClient): DataSubjectRequestRepository {
  return {
    async create({ accountId, kind, notes }) {
      const inserted = await db
        .insert(s.dataSubjectRequest)
        .values({ accountId, kind, notes: notes ?? null })
        .returning({ id: s.dataSubjectRequest.id, status: s.dataSubjectRequest.status });
      return inserted[0]!;
    },
  };
}
