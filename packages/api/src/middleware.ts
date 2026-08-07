import type { Permission } from '@dejatellevar/contracts';
import { can, permissionsFor } from '@dejatellevar/core';
import {
  makeAccountRepository,
  makeAuditLogRepository,
  makePlatformStaffRepository,
} from '@dejatellevar/db';
import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { ApiDeps, ApiEnv } from './context.js';
import { errorResponse } from './errors.js';

/** IP del cliente a partir de las cabeceras de proxy habituales. */
function clientIp(headers: {
  'x-forwarded-for'?: string | null;
  'x-real-ip'?: string | null;
}): string | null {
  return headers['x-forwarded-for']?.split(',')[0]?.trim() ?? headers['x-real-ip'] ?? null;
}

/** Nombre de la cookie de sesión (token del proveedor de auth, httpOnly). */
export const SESSION_COOKIE = 'dl_session';

/**
 * Middlewares transversales (§8). Simples y sin estado persistente en memoria
 * salvo el rate-limit y la idempotencia de demostración (en producción irían a
 * un almacén compartido tipo Redis/Runtime Cache).
 */

/** Asigna un id de request y lo devuelve en la cabecera. */
export const requestId: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const id = c.req.header('x-request-id') ?? crypto.randomUUID();
  c.set('requestId', id);
  c.header('x-request-id', id);
  await next();
};

/**
 * Autenticación: lee el token de la cookie httpOnly `dl_session` (o del header
 * Authorization: Bearer), lo verifica con el AuthProvider y mapea el usuario del
 * proveedor a nuestra cuenta local por external_auth_id. Si no hay sesión válida,
 * accountId queda en null (las rutas protegidas responden 401 con requireAuth).
 */
export function authContext(deps: ApiDeps): MiddlewareHandler<ApiEnv> {
  const accounts = makeAccountRepository(deps.db);
  return async (c, next) => {
    let accountId: string | null = null;
    const bearer = c.req.header('authorization')?.replace(/^Bearer\s+/i, '');
    const token = bearer || getCookie(c, SESSION_COOKIE);
    if (token) {
      try {
        const verified = await deps.auth.verifyToken(token);
        if (verified) {
          const account = await accounts.findByExternalAuthId(verified.externalUserId);
          accountId = account?.id ?? null;
        }
      } catch {
        accountId = null;
      }
    }
    c.set('accountId', accountId);
    c.set('organizationId', c.req.header('x-organization-id') ?? null);
    await next();
  };
}

/** Exige sesión (para endpoints de escritura). */
export const requireAuth: MiddlewareHandler<ApiEnv> = async (c, next) => {
  if (!c.get('accountId')) {
    return errorResponse(c, 401, 'UNAUTHENTICATED', 'Necesitas iniciar sesión');
  }
  await next();
};

/**
 * Contexto de plataforma: si la sesión pertenece al staff del backoffice, carga su
 * rol y calcula sus permisos efectivos (paquete del rol + extras). Para el resto de
 * usuarios queda en null / lista vacía.
 */
export function platformAuth(deps: ApiDeps): MiddlewareHandler<ApiEnv> {
  const staff = makePlatformStaffRepository(deps.db);
  return async (c, next) => {
    c.set('platformRole', null);
    c.set('platformPermissions', []);
    const accountId = c.get('accountId');
    if (accountId) {
      const member = await staff.findByAccountId(accountId);
      if (member) {
        c.set('platformRole', member.role);
        c.set('platformPermissions', permissionsFor(member.role, member.extraPermissions));
      }
    }
    await next();
  };
}

/** Exige un permiso de plataforma concreto (403 si falta). */
export function requirePermission(permission: Permission): MiddlewareHandler<ApiEnv> {
  return async (c, next) => {
    if (!c.get('accountId')) {
      return errorResponse(c, 401, 'UNAUTHENTICATED', 'Necesitas iniciar sesión');
    }
    if (!can(c.get('platformPermissions') ?? [], permission)) {
      return errorResponse(c, 403, 'FORBIDDEN', 'No tienes permiso para esta acción');
    }
    await next();
  };
}

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
const MUTATING = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/** Deriva recurso y acción legible desde la ruta (p.ej. /api/v1/services/<uuid>). */
function inferResource(
  method: string,
  path: string,
): {
  action: string;
  resourceType: string;
  resourceId: string | null;
} {
  const segments = path.split('/').filter(Boolean); // ['api','v1','services','<uuid>']
  const rest = segments.slice(2); // quita 'api','v1'
  const resourceType = rest.find((s) => !UUID_RE.test(s)) ?? 'unknown';
  const resourceId = rest.find((s) => UUID_RE.test(s)) ?? null;
  return {
    action: `${method} /${rest.join('/')}`.slice(0, 80),
    resourceType: resourceType.slice(0, 60),
    resourceId,
  };
}

/**
 * Auditoría automática (§11.12 / X15): tras cada request MUTANTE con respuesta 2xx
 * deja un asiento inmutable en audit_log (quién, qué, cuándo, IP, user agent).
 * Nunca rompe la respuesta: si el registro falla, solo se anota en consola.
 * El diff before/after por recurso se instrumenta por caso de uso, no aquí.
 */
export function auditTrail(deps: ApiDeps): MiddlewareHandler<ApiEnv> {
  const audit = makeAuditLogRepository(deps.db);
  return async (c, next) => {
    await next();
    if (!MUTATING.has(c.req.method)) return;
    const status = c.res.status;
    if (status < 200 || status >= 300) return;
    try {
      const { action, resourceType, resourceId } = inferResource(c.req.method, c.req.path);
      await audit.record({
        actorAccountId: c.get('accountId') ?? null,
        actorKind: 'user',
        action,
        resourceType,
        resourceId,
        organizationId: c.get('organizationId'),
        ipAddress: clientIp({
          'x-forwarded-for': c.req.header('x-forwarded-for'),
          'x-real-ip': c.req.header('x-real-ip'),
        }),
        userAgent: c.req.header('user-agent') ?? null,
      });
    } catch (e) {
      console.error('[audit] no se pudo registrar la acción:', e);
    }
  };
}

const seenKeys = new Set<string>();

/** Idempotencia: rechaza claves repetidas en POST con efecto económico (§8.2). */
export const idempotency: MiddlewareHandler<ApiEnv> = async (c, next) => {
  if (c.req.method === 'POST') {
    const key = c.req.header('idempotency-key');
    if (key) {
      if (seenKeys.has(key)) {
        return errorResponse(c, 409, 'IDEMPOTENCY_REPLAY', 'Esta operación ya se procesó');
      }
      seenKeys.add(key);
    }
  }
  await next();
};

const buckets = new Map<string, { count: number; reset: number }>();
const LIMIT = 120;
const WINDOW_MS = 60_000;

/** Límite de uso por ventana de 60s con cabeceras estándar (§8.2). */
export const rateLimit: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const who = c.get('accountId') ?? c.req.header('x-forwarded-for') ?? 'anon';
  const now = Date.now();
  const b = buckets.get(who);
  if (!b || b.reset < now) {
    buckets.set(who, { count: 1, reset: now + WINDOW_MS });
  } else {
    b.count += 1;
    if (b.count > LIMIT) {
      c.header('X-RateLimit-Limit', String(LIMIT));
      c.header('X-RateLimit-Remaining', '0');
      c.header('X-RateLimit-Reset', String(Math.ceil(b.reset / 1000)));
      return errorResponse(c, 429, 'RATE_LIMITED', 'Demasiadas solicitudes, intenta más tarde');
    }
  }
  const cur = buckets.get(who)!;
  c.header('X-RateLimit-Limit', String(LIMIT));
  c.header('X-RateLimit-Remaining', String(Math.max(0, LIMIT - cur.count)));
  c.header('X-RateLimit-Reset', String(Math.ceil(cur.reset / 1000)));
  await next();
};
