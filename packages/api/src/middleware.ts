import type { MiddlewareHandler } from 'hono';
import type { ApiEnv } from './context.js';
import { errorResponse } from './errors.js';

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
 * Autenticación: lee el token del header o de la cookie httpOnly. En esta etapa
 * de cimientos solo extrae el account/org del header para poder ejercitar la API;
 * el módulo de identidad lo reemplaza por verificación real con AuthProvider.
 */
export const auth: MiddlewareHandler<ApiEnv> = async (c, next) => {
  const accountId = c.req.header('x-account-id') ?? null;
  const organizationId = c.req.header('x-organization-id') ?? null;
  c.set('accountId', accountId);
  c.set('organizationId', organizationId);
  await next();
};

/** Exige sesión (para endpoints de escritura). */
export const requireAuth: MiddlewareHandler<ApiEnv> = async (c, next) => {
  if (!c.get('accountId')) {
    return errorResponse(c, 401, 'UNAUTHENTICATED', 'Necesitas iniciar sesión');
  }
  await next();
};

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
