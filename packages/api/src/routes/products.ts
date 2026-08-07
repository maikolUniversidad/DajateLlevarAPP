import { CreateProductReviewSchema } from '@dejatellevar/contracts';
import { schema } from '@dejatellevar/db';
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';
import { errorResponse } from '../errors.js';
import { axisLabel, axisScale } from '../lib/axes.js';
import { requireAuth } from '../middleware.js';

const { product, productReview, productReviewAxis, account } = schema;

/** Media 1..5 de los ejes de una reseña de producto. */
function productRating(axes: { value: number }[]): number | null {
  if (axes.length === 0) return null;
  return Number((axes.reduce((s, a) => s + a.value, 0) / axes.length).toFixed(2));
}

/**
 * Reseñas de productos (platos/combos). El listado y detalle del producto
 * viajan dentro de la ficha del servicio; aquí van solo sus opiniones.
 */
export function productsRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;

  // GET /v1/products/:id/reviews — opiniones de un plato (sabor, cantidad, …)
  app.get('/:id/reviews', async (c) => {
    const productId = c.req.param('id');
    const limit = Math.min(Number(c.req.query('limit') ?? 20) || 20, 100);
    const cursor = c.req.query('cursor');

    const page = await db
      .select({
        id: productReview.id,
        comment: productReview.comment,
        createdAt: productReview.createdAt,
        authorName: account.fullName,
      })
      .from(productReview)
      .innerJoin(account, eq(account.id, productReview.authorAccountId))
      .where(
        and(
          eq(productReview.productId, productId),
          eq(productReview.status, 'published'),
          cursor ? lt(productReview.createdAt, new Date(cursor)) : undefined,
        ),
      )
      .orderBy(desc(productReview.createdAt))
      .limit(limit + 1);

    const hasMore = page.length > limit;
    const rowsPage = page.slice(0, limit);
    const ids = rowsPage.map((x) => x.id);
    const axisRows = ids.length
      ? await db
          .select({
            reviewId: productReviewAxis.reviewId,
            axisKey: productReviewAxis.axisKey,
            value: productReviewAxis.value,
          })
          .from(productReviewAxis)
          .where(inArray(productReviewAxis.reviewId, ids))
      : [];
    const axesByReview = new Map<string, { axis_key: string; value: number }[]>();
    for (const a of axisRows) {
      const list = axesByReview.get(a.reviewId) ?? [];
      list.push({ axis_key: a.axisKey, value: Number(a.value) });
      axesByReview.set(a.reviewId, list);
    }

    return c.json({
      data: rowsPage.map((rv) => {
        const raw = axesByReview.get(rv.id) ?? [];
        return {
          id: rv.id,
          product_id: productId,
          author_name: rv.authorName,
          rating: productRating(raw),
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

  // POST /v1/products/:id/reviews — opinar de un plato (una por persona y plato)
  app.post('/:id/reviews', requireAuth, async (c) => {
    const productId = c.req.param('id');
    const accountId = c.get('accountId')!;
    const body = CreateProductReviewSchema.parse(await c.req.json());

    const prod = (
      await db
        .select({ serviceId: product.serviceId, organizationId: product.organizationId })
        .from(product)
        .where(eq(product.id, productId))
        .limit(1)
    )[0];
    if (!prod) return errorResponse(c, 404, 'PRODUCT_NOT_FOUND', 'El producto no existe');

    let reviewId: string;
    let createdAt: Date;
    try {
      const inserted = await db
        .insert(productReview)
        .values({
          productId,
          serviceId: prod.serviceId,
          organizationId: prod.organizationId,
          authorAccountId: accountId,
          comment: body.comment ?? null,
        })
        .returning({ id: productReview.id, createdAt: productReview.createdAt });
      reviewId = inserted[0]!.id;
      createdAt = inserted[0]!.createdAt;
    } catch (e) {
      if ((e as { code?: string }).code === '23505') {
        return errorResponse(c, 409, 'ALREADY_REVIEWED', 'Ya opinaste sobre este plato');
      }
      throw e;
    }

    await db
      .insert(productReviewAxis)
      .values(body.axes.map((a) => ({ reviewId, axisKey: a.axis_key, value: String(a.value) })));

    // Recalcula media y conteo del producto a partir de sus reseñas.
    await db.execute(sql`
      UPDATE product p SET avg_rating = sub.avg, review_count = sub.cnt
      FROM (
        SELECT AVG(m) AS avg, COUNT(*) AS cnt FROM (
          SELECT AVG(pra.value) AS m
          FROM product_review pr JOIN product_review_axis pra ON pra.review_id = pr.id
          WHERE pr.product_id = ${productId} AND pr.status = 'published'
          GROUP BY pr.id
        ) t
      ) sub
      WHERE p.id = ${productId}
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
        product_id: productId,
        author_name: author?.name ?? 'Tú',
        rating: productRating(body.axes.map((a) => ({ value: a.value }))),
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

  return app;
}
