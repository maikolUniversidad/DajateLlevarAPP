import { schema } from '@dejatellevar/db';
import { asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';

/**
 * Catálogo de categorías (público). Fuente de las opciones de interés del test de
 * gustos del cliente y del filtro de búsqueda.
 */
export function categoriesRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;

  // GET /v1/categories — categorías activas, ordenadas para presentación.
  app.get('/', async (c) => {
    const rows = await db
      .select()
      .from(schema.category)
      .where(eq(schema.category.isActive, true))
      .orderBy(asc(schema.category.sortOrder));
    return c.json({
      data: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name_es: r.nameEs,
        icon: r.icon,
        risk_category: r.riskCategory,
      })),
    });
  });

  return app;
}
