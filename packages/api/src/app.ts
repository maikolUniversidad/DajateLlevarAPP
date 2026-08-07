import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from './context.js';
import { onError } from './errors.js';
import { auth, idempotency, rateLimit, requestId } from './middleware.js';
import { openApiDocument } from './openapi.js';
import { servicesRoutes } from './routes/services.js';

/**
 * App de la API. Se construye con dependencias inyectadas (db) para no acoplar
 * el paquete al entorno. Se monta en Next en app/api/[[...route]]/route.ts.
 */
export function createApiApp(deps: ApiDeps) {
  // basePath '/api' para coincidir con el montaje en Next (app/api/[[...route]]).
  const app = new Hono<ApiEnv>().basePath('/api');

  app.use('*', requestId);
  app.use('*', auth);
  app.use('*', rateLimit);
  app.use('*', idempotency);
  app.onError(onError);

  app.get('/health', (c) => c.json({ ok: true, service: 'dejatellevar-api' }));
  app.get('/v1/openapi.json', (c) => c.json(openApiDocument()));

  app.route('/v1/services', servicesRoutes(deps));

  app.notFound((c) =>
    c.json({ error: { code: 'NOT_FOUND', message: 'Recurso no encontrado' } }, 404),
  );

  return app;
}

export type ApiApp = ReturnType<typeof createApiApp>;
