import type { Permission, PlatformRole } from '@dejatellevar/contracts';
import type {
  AuditLogEntry,
  AuditLogFilters,
  AuditLogQueryPort,
  AuditLogRecorder,
  DomainEventFilters,
  DomainEventQueryPort,
  DomainEventRecord,
  Page,
  PlatformStaff,
  PlatformStaffRepository,
} from '@dejatellevar/core';
import { type SQL, and, desc, sql as dsql, eq, gte, isNull, lte } from 'drizzle-orm';
import type { DbClient } from './client.js';
import * as s from './schema.js';

/**
 * Repositorios del backoffice. La paginación es por cursor keyset sobre
 * (occurred_at, id) DESC: estable aunque haya marcas de tiempo repetidas.
 */

// --- Cursor keyset (occurred_at, id) ----------------------------------------

function encodeCursor(occurredAt: Date, id: string): string {
  return Buffer.from(`${occurredAt.toISOString()}|${id}`).toString('base64url');
}

function decodeCursor(cursor: string): { occurredAt: string; id: string } | null {
  try {
    const [occurredAt, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
    if (!occurredAt || !id) return null;
    return { occurredAt, id };
  } catch {
    return null;
  }
}

// --- Staff de plataforma ----------------------------------------------------

function mapStaff(r: typeof s.platformStaff.$inferSelect): PlatformStaff {
  return {
    accountId: r.accountId,
    role: r.role as PlatformRole,
    extraPermissions: (r.extraPermissions ?? []) as Permission[],
    grantedBy: r.grantedBy,
    createdAt: r.createdAt,
  };
}

export function makePlatformStaffRepository(db: DbClient): PlatformStaffRepository {
  return {
    async findByAccountId(accountId) {
      const rows = await db
        .select()
        .from(s.platformStaff)
        .where(and(eq(s.platformStaff.accountId, accountId), isNull(s.platformStaff.deletedAt)))
        .limit(1);
      return rows[0] ? mapStaff(rows[0]) : null;
    },
    async list() {
      const rows = await db
        .select()
        .from(s.platformStaff)
        .where(isNull(s.platformStaff.deletedAt))
        .orderBy(desc(s.platformStaff.createdAt));
      return rows.map(mapStaff);
    },
    async upsert(input) {
      const rows = await db
        .insert(s.platformStaff)
        .values({
          accountId: input.accountId,
          role: input.role,
          extraPermissions: input.extraPermissions,
          grantedBy: input.grantedBy,
        })
        .onConflictDoUpdate({
          target: s.platformStaff.accountId,
          set: {
            role: input.role,
            extraPermissions: input.extraPermissions,
            grantedBy: input.grantedBy,
            deletedAt: null,
            updatedAt: new Date(),
          },
        })
        .returning();
      return mapStaff(rows[0]!);
    },
    async revoke(accountId) {
      await db
        .update(s.platformStaff)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(s.platformStaff.accountId, accountId));
    },
  };
}

// --- Auditoría (escribir + consultar) ---------------------------------------

function mapAudit(r: typeof s.auditLog.$inferSelect): AuditLogEntry {
  return {
    id: r.id,
    actorAccountId: r.actorAccountId,
    actorKind: r.actorKind,
    action: r.action,
    resourceType: r.resourceType,
    resourceId: r.resourceId,
    organizationId: r.organizationId,
    ipAddress: r.ipAddress,
    occurredAt: r.occurredAt,
  };
}

export function makeAuditLogRepository(db: DbClient): AuditLogRecorder & AuditLogQueryPort {
  return {
    async record(input) {
      await db.insert(s.auditLog).values({
        actorAccountId: input.actorAccountId ?? null,
        actorKind: input.actorKind,
        action: input.action,
        resourceType: input.resourceType,
        resourceId: input.resourceId ?? null,
        organizationId: input.organizationId ?? null,
        beforeState: input.beforeState ?? null,
        afterState: input.afterState ?? null,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      });
    },
    async list(filters: AuditLogFilters, page): Promise<Page<AuditLogEntry>> {
      const conditions: (SQL | undefined)[] = [];
      if (filters.actorAccountId)
        conditions.push(eq(s.auditLog.actorAccountId, filters.actorAccountId));
      if (filters.resourceType) conditions.push(eq(s.auditLog.resourceType, filters.resourceType));
      if (filters.action) conditions.push(eq(s.auditLog.action, filters.action));
      if (filters.from) conditions.push(gte(s.auditLog.occurredAt, filters.from));
      if (filters.to) conditions.push(lte(s.auditLog.occurredAt, filters.to));

      const cur = page.cursor ? decodeCursor(page.cursor) : null;
      if (cur) {
        conditions.push(
          dsql`(${s.auditLog.occurredAt}, ${s.auditLog.id}) < (${cur.occurredAt}::timestamptz, ${cur.id}::uuid)`,
        );
      }

      const rows = await db
        .select()
        .from(s.auditLog)
        .where(and(...conditions))
        .orderBy(desc(s.auditLog.occurredAt), desc(s.auditLog.id))
        .limit(page.limit + 1);

      const hasMore = rows.length > page.limit;
      const pageRows = rows.slice(0, page.limit);
      const last = pageRows[pageRows.length - 1];
      return {
        data: pageRows.map(mapAudit),
        nextCursor: hasMore && last ? encodeCursor(last.occurredAt, last.id) : null,
      };
    },
  };
}

// --- Explorador de eventos de dominio ---------------------------------------

function mapEvent(r: typeof s.domainEvent.$inferSelect): DomainEventRecord {
  return {
    id: r.id,
    eventType: r.eventType,
    aggregateType: r.aggregateType,
    aggregateId: r.aggregateId,
    organizationId: r.organizationId,
    actorAccountId: r.actorAccountId,
    payload: r.payload as Record<string, unknown>,
    occurredAt: r.occurredAt,
  };
}

export function makeDomainEventQuery(db: DbClient): DomainEventQueryPort {
  return {
    async list(filters: DomainEventFilters, page): Promise<Page<DomainEventRecord>> {
      const conditions: (SQL | undefined)[] = [];
      if (filters.eventType) conditions.push(eq(s.domainEvent.eventType, filters.eventType));
      if (filters.aggregateType)
        conditions.push(eq(s.domainEvent.aggregateType, filters.aggregateType));
      if (filters.aggregateId) conditions.push(eq(s.domainEvent.aggregateId, filters.aggregateId));
      if (filters.organizationId)
        conditions.push(eq(s.domainEvent.organizationId, filters.organizationId));
      if (filters.from) conditions.push(gte(s.domainEvent.occurredAt, filters.from));
      if (filters.to) conditions.push(lte(s.domainEvent.occurredAt, filters.to));

      const cur = page.cursor ? decodeCursor(page.cursor) : null;
      if (cur) {
        conditions.push(
          dsql`(${s.domainEvent.occurredAt}, ${s.domainEvent.id}) < (${cur.occurredAt}::timestamptz, ${cur.id}::uuid)`,
        );
      }

      const rows = await db
        .select()
        .from(s.domainEvent)
        .where(and(...conditions))
        .orderBy(desc(s.domainEvent.occurredAt), desc(s.domainEvent.id))
        .limit(page.limit + 1);

      const hasMore = rows.length > page.limit;
      const pageRows = rows.slice(0, page.limit);
      const last = pageRows[pageRows.length - 1];
      return {
        data: pageRows.map(mapEvent),
        nextCursor: hasMore && last ? encodeCursor(last.occurredAt, last.id) : null,
      };
    },
  };
}
