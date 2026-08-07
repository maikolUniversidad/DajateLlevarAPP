import {
  AssignPlatformRoleSchema,
  AuditLogQuerySchema,
  DomainEventQuerySchema,
} from '@dejatellevar/contracts';
import { assignPlatformRole, permissionsFor } from '@dejatellevar/core';
import type { AuditLogEntry, DomainEventRecord, PlatformStaff } from '@dejatellevar/core';
import {
  makeAuditLogRepository,
  makeDomainEventQuery,
  makeEventPublisher,
  makePlatformStaffRepository,
  systemClock,
} from '@dejatellevar/db';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';
import { domainStatus, errorResponse } from '../errors.js';
import { requireAuth, requirePermission } from '../middleware.js';

function clientIp(c: { req: { header: (n: string) => string | undefined } }): string | null {
  return (
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? null
  );
}

function mapStaff(r: PlatformStaff) {
  return {
    account_id: r.accountId,
    role: r.role,
    extra_permissions: r.extraPermissions,
    permissions: permissionsFor(r.role, r.extraPermissions),
    granted_by: r.grantedBy,
    created_at: r.createdAt.toISOString(),
  };
}

function mapAudit(r: AuditLogEntry) {
  return {
    id: r.id,
    actor_account_id: r.actorAccountId,
    actor_kind: r.actorKind,
    action: r.action,
    resource_type: r.resourceType,
    resource_id: r.resourceId,
    organization_id: r.organizationId,
    ip_address: r.ipAddress,
    occurred_at: r.occurredAt.toISOString(),
  };
}

function mapEvent(r: DomainEventRecord) {
  return {
    id: r.id,
    event_type: r.eventType,
    aggregate_type: r.aggregateType,
    aggregate_id: r.aggregateId,
    organization_id: r.organizationId,
    actor_account_id: r.actorAccountId,
    payload: r.payload,
    occurred_at: r.occurredAt.toISOString(),
  };
}

/**
 * Consola de administración de plataforma (§7.6). Cada endpoint exige el permiso
 * granular correspondiente; requireAuth garantiza sesión en todo el subárbol.
 */
export function adminRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const staff = makePlatformStaffRepository(deps.db);
  const audit = makeAuditLogRepository(deps.db);
  const events = makeDomainEventQuery(deps.db);
  const publisher = makeEventPublisher(deps.db);

  app.use('*', requireAuth);

  // GET /me — rol y permisos efectivos del staff autenticado (cualquier staff).
  app.get('/me', (c) => {
    const role = c.get('platformRole');
    if (!role) {
      return errorResponse(c, 403, 'FORBIDDEN', 'No eres parte del staff de plataforma');
    }
    return c.json({
      account_id: c.get('accountId'),
      role,
      permissions: c.get('platformPermissions'),
    });
  });

  // GET /audit — registro de auditoría (X15).
  app.get('/audit', requirePermission('audit:read'), async (c) => {
    const q = AuditLogQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams));
    const page = await audit.list(
      {
        actorAccountId: q.actor_account_id,
        resourceType: q.resource_type,
        action: q.action,
        from: q.from ? new Date(q.from) : undefined,
        to: q.to ? new Date(q.to) : undefined,
      },
      { cursor: q.cursor, limit: q.limit },
    );
    return c.json({ data: page.data.map(mapAudit), next_cursor: page.nextCursor });
  });

  // GET /events — explorador de eventos de dominio (X14).
  app.get('/events', requirePermission('events:read'), async (c) => {
    const q = DomainEventQuerySchema.parse(Object.fromEntries(new URL(c.req.url).searchParams));
    const page = await events.list(
      {
        eventType: q.event_type,
        aggregateType: q.aggregate_type,
        aggregateId: q.aggregate_id,
        organizationId: q.organization_id,
        from: q.from ? new Date(q.from) : undefined,
        to: q.to ? new Date(q.to) : undefined,
      },
      { cursor: q.cursor, limit: q.limit },
    );
    return c.json({ data: page.data.map(mapEvent), next_cursor: page.nextCursor });
  });

  // GET /staff — listado del staff de plataforma.
  app.get('/staff', requirePermission('roles:manage'), async (c) => {
    const rows = await staff.list();
    return c.json({ data: rows.map(mapStaff) });
  });

  // POST /staff — asignar o cambiar el rol de una cuenta.
  app.post('/staff', requirePermission('roles:manage'), async (c) => {
    const body = AssignPlatformRoleSchema.parse(await c.req.json());
    const result = await assignPlatformRole(
      { staff, events: publisher, audit, clock: systemClock },
      {
        actorAccountId: c.get('accountId')!,
        targetAccountId: body.account_id,
        role: body.role,
        extraPermissions: body.extra_permissions,
        evidence: { ipAddress: clientIp(c), userAgent: c.req.header('user-agent') ?? null },
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
    return c.json(mapStaff(result.value), 201);
  });

  // DELETE /staff/:accountId — revocar el rol de plataforma.
  app.delete('/staff/:accountId', requirePermission('roles:manage'), async (c) => {
    const target = c.req.param('accountId');
    if (target === c.get('accountId')) {
      // Evita que un super_admin se quede sin acceso por accidente.
      return errorResponse(c, 422, 'CANNOT_REVOKE_SELF', 'No puedes revocar tu propio acceso');
    }
    await staff.revoke(target);
    await publisher.publish({
      eventType: 'platform_staff.role_revoked',
      aggregateType: 'platform_staff',
      aggregateId: target,
      actorAccountId: c.get('accountId'),
      payload: {},
    });
    return c.json({ ok: true });
  });

  return app;
}
