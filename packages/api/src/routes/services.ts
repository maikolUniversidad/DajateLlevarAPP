import {
  CreateServiceSchema,
  CreateVenueReviewSchema,
  ServiceSearchSchema,
} from '@dejatellevar/contracts';
import { schema } from '@dejatellevar/db';
import { and, asc, desc, eq, gte, ilike, inArray, isNull, lt, lte, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';
import { errorResponse } from '../errors.js';
import { axisLabel, axisScale, ratingBucket } from '../lib/axes.js';
import { requireAuth } from '../middleware.js';

const { service, category, review, reviewAxis, account, booking } = schema;

type ReviewAxisKind = (typeof schema.reviewAxisKind.enumValues)[number];
const VENUE_AXIS_KINDS = new Set<string>(schema.reviewAxisKind.enumValues);

/** Media 1..5 de los ejes de una reseña (excluye Expectativa vs Realidad). */
function reviewRating(axes: { axis_key: string; value: number }[]): number | null {
  const scored = axes.filter((a) => a.axis_key !== 'expectation_vs_reality');
  if (scored.length === 0) return null;
  return Number((scored.reduce((s, a) => s + a.value, 0) / scored.length).toFixed(2));
}

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
    latitude: r.latitude === null ? null : Number(r.latitude),
    longitude: r.longitude === null ? null : Number(r.longitude),
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

  // GET /v1/services/:id — ficha enriquecida (facts, ejes, productos)
  app.get('/:id', async (c) => {
    const id = c.req.param('id');
    const rows = await db
      .select()
      .from(service)
      .where(and(eq(service.id, id), isNull(service.deletedAt)))
      .limit(1);
    const r = rows[0];
    if (!r) return errorResponse(c, 404, 'SERVICE_NOT_FOUND', 'El servicio no existe');

    // Config de ejes de la categoría (local + producto).
    const axisCfg = (await db.execute(sql`
      SELECT scope, axis_key, label_es, value_scale, sort_order
      FROM category_review_axis
      WHERE category_id = ${r.categoryId} AND is_active
      ORDER BY scope, sort_order
    `)) as unknown as {
      scope: string;
      axis_key: string;
      label_es: string;
      value_scale: '1_5' | 'neg3_3';
    }[];

    // Promedios de ejes de local sobre reseñas publicadas.
    const venueAvgRows = (await db.execute(sql`
      SELECT ra.kind::text AS axis_key,
             AVG(ra.value)::float AS average,
             COUNT(*)::int AS count
      FROM review r
      JOIN review_axis ra ON ra.review_id = r.id
      WHERE r.service_id = ${id} AND r.status = 'published'
      GROUP BY ra.kind
    `)) as unknown as { axis_key: string; average: number; count: number }[];
    const venueAvg = new Map(venueAvgRows.map((x) => [x.axis_key, x]));

    // Distribución de estrellas: media 1..5 por reseña.
    const meanRows = (await db.execute(sql`
      SELECT AVG(ra.value)::float AS mean
      FROM review r
      JOIN review_axis ra ON ra.review_id = r.id
      WHERE r.service_id = ${id} AND r.status = 'published'
        AND ra.kind <> 'expectation_vs_reality'
      GROUP BY r.id
    `)) as unknown as { mean: number }[];
    const distribution = { excelente: 0, bueno: 0, promedio: 0, malo: 0 };
    for (const m of meanRows) distribution[ratingBucket(m.mean)]++;
    const summaryAvg = meanRows.length
      ? Number((meanRows.reduce((s, m) => s + m.mean, 0) / meanRows.length).toFixed(2))
      : r.avgRating === null
        ? null
        : Number(r.avgRating);

    // Productos (platos/combos).
    const productRows = (await db.execute(sql`
      SELECT id, name, description, price, currency, image_url, is_combo, avg_rating, review_count
      FROM product
      WHERE service_id = ${id} AND is_active AND deleted_at IS NULL
      ORDER BY sort_order, name
    `)) as unknown as {
      id: string;
      name: string;
      description: string | null;
      price: string | number | null;
      currency: string;
      image_url: string | null;
      is_combo: boolean;
      avg_rating: string | null;
      review_count: number;
    }[];

    const axes = axisCfg
      .filter((a) => a.scope === 'venue')
      .map((a) => {
        const agg = venueAvg.get(a.axis_key);
        return {
          axis_key: a.axis_key,
          label: a.label_es,
          scope: 'venue' as const,
          value_scale: a.value_scale,
          average: agg ? agg.average : null,
          count: agg ? agg.count : 0,
        };
      });
    const productAxes = axisCfg
      .filter((a) => a.scope === 'product')
      .map((a) => ({
        axis_key: a.axis_key,
        label: a.label_es,
        scope: 'product' as const,
        value_scale: a.value_scale,
      }));

    return c.json({
      ...mapService(r),
      requires_reservation: r.modality === 'scheduled' || r.modality === 'capacity',
      avg_price_per_person:
        r.pricePer === 'person' && r.basePrice !== null
          ? { amount: r.basePrice, currency: r.currency }
          : null,
      rating_summary: { average: summaryAvg, count: r.reviewCount, distribution },
      axes,
      product_axes: productAxes,
      products: productRows.map((p) => ({
        id: p.id,
        service_id: id,
        name: p.name,
        description: p.description,
        price: p.price === null ? null : { amount: Number(p.price), currency: p.currency },
        image_url: p.image_url,
        is_combo: p.is_combo,
        avg_rating: p.avg_rating === null ? null : Number(p.avg_rating),
        review_count: p.review_count,
      })),
    });
  });

  // GET /v1/services/:id/reviews — opiniones del local (con sus ejes)
  app.get('/:id/reviews', async (c) => {
    const id = c.req.param('id');
    const limit = Math.min(Number(c.req.query('limit') ?? 20) || 20, 100);
    const cursor = c.req.query('cursor');

    const page = await db
      .select({
        id: review.id,
        comment: review.comment,
        createdAt: review.createdAt,
        authorName: account.fullName,
      })
      .from(review)
      .innerJoin(account, eq(account.id, review.authorAccountId))
      .where(
        and(
          eq(review.serviceId, id),
          eq(review.status, 'published'),
          cursor ? lt(review.createdAt, new Date(cursor)) : undefined,
        ),
      )
      .orderBy(desc(review.createdAt))
      .limit(limit + 1);

    const hasMore = page.length > limit;
    const rowsPage = page.slice(0, limit);
    const ids = rowsPage.map((x) => x.id);
    const axisRows = ids.length
      ? await db
          .select({
            reviewId: reviewAxis.reviewId,
            kind: reviewAxis.kind,
            value: reviewAxis.value,
          })
          .from(reviewAxis)
          .where(inArray(reviewAxis.reviewId, ids))
      : [];
    const axesByReview = new Map<string, { axis_key: string; value: number }[]>();
    for (const a of axisRows) {
      const list = axesByReview.get(a.reviewId) ?? [];
      list.push({ axis_key: a.kind, value: Number(a.value) });
      axesByReview.set(a.reviewId, list);
    }

    return c.json({
      data: rowsPage.map((rv) => {
        const raw = axesByReview.get(rv.id) ?? [];
        return {
          id: rv.id,
          author_name: rv.authorName,
          rating: reviewRating(raw),
          comment: rv.comment,
          created_at: rv.createdAt.toISOString(),
          axes: raw.map((a) => ({
            axis_key: a.axis_key,
            label: axisLabel(a.axis_key),
            value: a.value,
            value_scale: axisScale(a.axis_key),
          })),
        };
      }),
      next_cursor: hasMore ? rowsPage[rowsPage.length - 1]!.createdAt.toISOString() : null,
    });
  });

  // POST /v1/services/:id/reviews — opinar del local (exige reserva completada)
  app.post('/:id/reviews', requireAuth, async (c) => {
    const id = c.req.param('id');
    const accountId = c.get('accountId')!;
    const body = CreateVenueReviewSchema.parse(await c.req.json());

    for (const a of body.axes) {
      if (!VENUE_AXIS_KINDS.has(a.axis_key)) {
        return errorResponse(c, 422, 'INVALID_AXIS', `Eje no válido: ${a.axis_key}`);
      }
    }

    const svc = (
      await db
        .select({ organizationId: service.organizationId })
        .from(service)
        .where(and(eq(service.id, id), isNull(service.deletedAt)))
        .limit(1)
    )[0];
    if (!svc) return errorResponse(c, 404, 'SERVICE_NOT_FOUND', 'El servicio no existe');

    // Reserva elegible: del usuario, de este servicio, completada y sin reseña.
    let bookingId = body.booking_id;
    if (bookingId) {
      const ok = (
        await db
          .select({ id: booking.id })
          .from(booking)
          .where(
            and(
              eq(booking.id, bookingId),
              eq(booking.serviceId, id),
              eq(booking.clientAccountId, accountId),
              eq(booking.status, 'completed'),
            ),
          )
          .limit(1)
      )[0];
      if (!ok) return errorResponse(c, 422, 'NO_ELIGIBLE_BOOKING', 'Esa reserva no es válida');
    } else {
      const found = (await db.execute(sql`
        SELECT b.id FROM booking b
        WHERE b.service_id = ${id} AND b.client_account_id = ${accountId} AND b.status = 'completed'
          AND NOT EXISTS (SELECT 1 FROM review r WHERE r.booking_id = b.id)
        LIMIT 1
      `)) as unknown as { id: string }[];
      if (found.length === 0) {
        return errorResponse(
          c,
          422,
          'NO_ELIGIBLE_BOOKING',
          'Necesitas una reserva completada de este lugar para opinar',
        );
      }
      bookingId = found[0]!.id;
    }

    let reviewId: string;
    let createdAt: Date;
    try {
      const inserted = await db
        .insert(review)
        .values({
          bookingId,
          serviceId: id,
          organizationId: svc.organizationId,
          authorAccountId: accountId,
          comment: body.comment ?? null,
        })
        .returning({ id: review.id, createdAt: review.createdAt });
      reviewId = inserted[0]!.id;
      createdAt = inserted[0]!.createdAt;
    } catch (e) {
      if ((e as { code?: string }).code === '23505') {
        return errorResponse(c, 409, 'ALREADY_REVIEWED', 'Esa reserva ya tiene reseña');
      }
      throw e;
    }

    await db.insert(reviewAxis).values(
      body.axes.map((a) => ({
        reviewId,
        kind: a.axis_key as ReviewAxisKind,
        value: String(a.value),
      })),
    );

    // Recalcula media, conteo y fidelidad del servicio.
    await db.execute(sql`
      UPDATE service s SET avg_rating = agg.avg, review_count = agg.cnt, expectation_fidelity = agg.evr
      FROM (
        SELECT
          (SELECT AVG(m) FROM (
            SELECT AVG(ra.value) AS m FROM review r JOIN review_axis ra ON ra.review_id = r.id
            WHERE r.service_id = ${id} AND r.status = 'published' AND ra.kind <> 'expectation_vs_reality'
            GROUP BY r.id
          ) t) AS avg,
          (SELECT COUNT(*) FROM review r WHERE r.service_id = ${id} AND r.status = 'published') AS cnt,
          (SELECT AVG(ra.value) FROM review r JOIN review_axis ra ON ra.review_id = r.id
            WHERE r.service_id = ${id} AND r.status = 'published' AND ra.kind = 'expectation_vs_reality') AS evr
      ) agg
      WHERE s.id = ${id}
    `);

    const author = (
      await db
        .select({ name: account.fullName })
        .from(account)
        .where(eq(account.id, accountId))
        .limit(1)
    )[0];

    return c.json(
      {
        id: reviewId,
        author_name: author?.name ?? 'Tú',
        rating: reviewRating(body.axes.map((a) => ({ axis_key: a.axis_key, value: a.value }))),
        comment: body.comment ?? null,
        created_at: createdAt.toISOString(),
        axes: body.axes.map((a) => ({
          axis_key: a.axis_key,
          label: axisLabel(a.axis_key),
          value: a.value,
          value_scale: axisScale(a.axis_key),
        })),
      },
      201,
    );
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
