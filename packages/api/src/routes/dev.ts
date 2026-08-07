import { makeAccountRepository } from '@dejatellevar/db';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';
import { DEV_TOKEN_PREFIX } from '../middleware.js';

/** Cuenta demo del seed que usa el shim de desarrollo. */
const DEMO_EMAIL = 'carlos.parrado@example.co';

/**
 * Rutas SOLO de desarrollo. Se montan únicamente cuando el shim está activo
 * (ver app.ts). Entregan una sesión demo para poder escribir sin Supabase.
 */
export function devRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const accounts = makeAccountRepository(deps.db);

  // GET /v1/dev/session — cuenta demo + token para el header Authorization.
  app.get('/session', async (c) => {
    const account = await accounts.findByEmail(DEMO_EMAIL);
    if (!account) {
      return c.json(
        { error: { code: 'DEMO_ACCOUNT_MISSING', message: 'Corre pnpm db:seed' } },
        404,
      );
    }
    return c.json({
      account: { id: account.id, full_name: account.fullName },
      token: `${DEV_TOKEN_PREFIX}${account.id}`,
    });
  });

  return app;
}
