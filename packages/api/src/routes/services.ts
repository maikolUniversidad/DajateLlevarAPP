import { CreateServiceSchema, ServiceSearchSchema } from '@dejatellevar/contracts';
import { schema } from '@dejatellevar/db';
import { and, asc, desc, eq, gte, ilike, isNull, lte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';
import { errorResponse } from '../errors.js';
import { requireAuth } from '../middleware.js';

const { service, category } = schema;

/** slug seguro: minúsculas, sin tildes (rango combinante U+0300–U+036F), guiones. */
function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function mapService(r: typeof service.$inferSelect) {
  return {
    id: r.id,
    organization_id: r.organizationId,
    slug: r.slug,
    name: r.name,
    short_description: r.shortDescription,
    description: r.description,
    category_id: r.categoryId,
    modality: r.modality,
    status: r.status,
    pricing_mode: r.pricingMode,
    base_price: r.basePrice === null ? null : { amount: r.basePrice, currency: r.currency },
    price_per: r.pricePer,
    duration_minutes: r.durationMinutes,
    min_participants: r.minParticipants,
    max_participants: r.maxParticipants,
    location_mode: r.locationMode,
    city: r.city,
    department: r.department,
    cancellation_policy: r.cancellationPolicy,
    risk_category: r.riskCategory,
    requires_waiver: r.requiresWaiver,
    accessibility: r.accessibility,
    avg_rating: r.avgRating === null ? null : Number(r.avgRating),
    fidelity: {
      value: r.expectationFidelity === null ? null : Number(r.expectationFidelity),
      sampleSize: r.reviewCount,
    },
    review_count: r.reviewCount,
    published_at: r.publishedAt ? r.publishedAt.toISOString() : null,
  };
}

export function servicesRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;

  // GET /v1/services — búsqueda pública con filtros (§8.1)
  app.get('/', async (c) => {
    const q = ServiceSearchSchema.parse(Object.fromEntries(new URL(c.req.url).searchParams));

    const conditions = [eq(service.status, 'published'), isNull(service.deletedAt)];
    if (q.q) conditions.push(ilike(service.name, `%${q.q}%`));
    if (q.city) conditions.push(ilike(service.city, `%${q.city}%`));
    if (q.price_min !== undefined) conditions.push(gte(service.basePrice, q.price_min));
    if (q.price_max !== undefined) conditions.push(lte(service.basePrice, q.price_max));
    if (q.fidelity_min !== undefined) {
      conditions.push(gte(service.expectationFidelity, String(q.fidelity_min)));
    }
    if (q.category) {
      const cat = (
        await db
          .select({ id: category.id })
          .from(category)
          .where(eq(category.slug, q.category))
          .limit(1)
      )[0];
      if (cat) conditions.push(eq(service.categoryId, cat.id));
      else return c.json({ data: [], next_cursor: null });
    }

    const orderBy = {
      relevance: desc(service.reviewCount),
      price_asc: asc(service.basePrice),
      price_desc: desc(service.basePrice),
      fidelity: desc(service.expectationFidelity),
      rating: desc(service.avgRating),
      newest: desc(service.publishedAt),
    }[q.sort];

    const rows = await db
      .select()
      .from(service)
      .where(and(...conditions))
      .orderBy(orderBy)
      .limit(q.limit + 1);

    const hasMore = rows.length > q.limit;
    const page = rows.slice(0, q.limit);
    return c.json({
      data: page.map(mapService),
      next_cursor: hasMore ? page[page.length - 1]!.id : null,
    });
  });

  // GET /v1/services/:id
  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const rows = await db
      .select()
      .from(service)
      .where(and(eq(service.id, id), isNull(service.deletedAt)))
      .limit(1);
    const r = rows[0];
    if (!r) return errorResponse(c, 404, 'SERVICE_NOT_FOUND', 'El servicio no existe');
    return c.json(mapService(r));
  });

  // POST /v1/services — crear servicio (catalog:write)
  app.post('/', requireAuth, async (c) => {
    const body = CreateServiceSchema.parse(await c.req.json());

    // La reserva de riesgo alto y RNT se validan en el módulo de catálogo; aquí
    // se persiste el borrador tras validar el esquema.
    const inserted = await db
      .insert(service)
      .values({
        organizationId: body.organization_id,
        slug: slugify(body.name),
        name: body.name,
        shortDescription: body.short_description ?? null,
        description: body.description,
        categoryId: body.category_id,
        modality: body.modality,
        status: 'draft',
        pricingMode: body.pricing_mode,
        basePrice: body.base_price?.amount ?? null,
        currency: body.base_price?.currency ?? 'COP',
        pricePer: body.price_per,
        durationMinutes: body.duration_minutes ?? null,
        minParticipants: body.min_participants,
        maxParticipants: body.max_participants ?? null,
        locationMode: body.location_mode,
        city: body.city ?? null,
        department: body.department ?? null,
        cancellationPolicy: body.cancellation_policy,
        riskCategory: body.risk_category,
        accessibility: body.accessibility,
      })
      .returning();

    return c.json(mapService(inserted[0]!), 201);
  });

  return app;
}
