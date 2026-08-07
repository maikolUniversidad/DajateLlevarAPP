import { schema } from '@dejatellevar/db';
import { asc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';

const { category } = schema;

/**
 * Taxonomía de actividades (§4). Alimenta el filtro de "actividades" del
 * descubrimiento y los chips del home. Pública: no requiere sesión.
 */
export function categoriesRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;

  // GET /v1/categories — categorías activas, ordenadas para presentación.
  app.get('/', async (c) => {
    const rows = await db
      .select()
      .from(category)
      .where(eq(category.isActive, true))
      .orderBy(asc(category.sortOrder), asc(category.nameEs));

    return c.json({
      data: rows.map((r) => ({
        id: r.id,
        slug: r.slug,
        name: r.nameEs,
        parent_id: r.parentId,
        icon: r.icon,
        risk_category: r.riskCategory,
        sort_order: r.sortOrder,
      })),
    });
  });

  return app;
}
