import { makeAccountRepository } from '@dejatellevar/db';
import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { ApiDeps, ApiEnv } from './context.js';
import { errorResponse } from './errors.js';

/** Nombre de la cookie de sesión (token del proveedor de auth, httpOnly). */
export const SESSION_COOKIE = 'dl_session';

/** Prefijo de token del shim de desarrollo: `dev-account:<uuid>`. */
export const DEV_TOKEN_PREFIX = 'dev-account:';

/**
 * Puente de identidad SOLO para desarrollo. Habilitado únicamente si
 * ALLOW_DEV_AUTH === 'true' y NODE_ENV !== 'production'. Permite actuar como una
 * cuenta sembrada sin Supabase. NUNCA debe activarse en producción.
 */
export function devAuthEnabled(): boolean {
  return process.env.ALLOW_DEV_AUTH === 'true' && process.env.NODE_ENV !== 'production';
}

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
      if (devAuthEnabled() && token.startsWith(DEV_TOKEN_PREFIX)) {
        // Solo desarrollo: el token porta directamente el id de cuenta.
        const account = await accounts.findById(token.slice(DEV_TOKEN_PREFIX.length));
        accountId = account?.id ?? null;
      } else {
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
