import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from './context.js';
import { onError } from './errors.js';
import {
  auditTrail,
  authContext,
  idempotency,
  platformAuth,
  rateLimit,
  requestId,
} from './middleware.js';
import { openApiDocument } from './openapi.js';
import { adminRoutes } from './routes/admin.js';
import { authRoutes } from './routes/auth.js';
import { campaignsRoutes } from './routes/campaigns.js';
import { categoriesRoutes } from './routes/categories.js';
import { creatorRoutes } from './routes/creators.js';
import { meRoutes } from './routes/me.js';
import { ledgerRoutes, paymentsRoutes, wompiWebhookRoutes } from './routes/payments.js';
import { servicesRoutes } from './routes/services.js';

/**
 * App de la API. Se construye con dependencias inyectadas (db) para no acoplar
 * el paquete al entorno. Se monta en Next en app/api/[[...route]]/route.ts.
 */
export function createApiApp(deps: ApiDeps) {
  // basePath '/api' para coincidir con el montaje en Next (app/api/[[...route]]).
  const app = new Hono<ApiEnv>().basePath('/api');

  app.use('*', requestId);
  app.use('*', authContext(deps));
  app.use('*', platformAuth(deps));
  app.use('*', rateLimit);
  app.use('*', idempotency);
  // Deja rastro de toda acción mutante con respuesta 2xx (§11.12 / X15).
  app.use('*', auditTrail(deps));
  app.onError(onError);

  app.get('/health', (c) => c.json({ ok: true, service: 'dejatellevar-api' }));
  app.get('/v1/openapi.json', (c) => c.json(openApiDocument()));

  app.route('/v1/auth', authRoutes(deps));
  app.route('/v1/categories', categoriesRoutes(deps));
  app.route('/v1/me', meRoutes(deps));
  app.route('/v1/creators', creatorRoutes(deps));
  app.route('/v1/campaigns', campaignsRoutes(deps));
  app.route('/v1/services', servicesRoutes(deps));
  app.route('/v1/payments', paymentsRoutes(deps));
  app.route('/v1/ledger', ledgerRoutes(deps));
  app.route('/v1/admin', adminRoutes(deps));
  // Webhook del PSP: público (sin sesión), firma verificada dentro del handler.
  app.route('/webhooks/wompi', wompiWebhookRoutes(deps));

  app.notFound((c) =>
    c.json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } }, 404),
  );

  return app;
}

export type ApiApp = ReturnType<typeof createApiApp>;
