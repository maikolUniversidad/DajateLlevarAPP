import { z } from 'zod';
import { paginated } from './common.js';
import { MoneySchema } from './money.js';

/** Escala de un eje: 1..5 (estrellas) o -3..3 (Expectativa vs Realidad). */
export const AxisScale = z.enum(['1_5', 'neg3_3']);
export const AxisScope = z.enum(['venue', 'product']);

/**
 * Definición de un eje configurado para una categoría (qué se califica y cómo
 * se rotula). No lleva valor: describe el eje.
 */
export const AxisDefSchema = z.object({
  axis_key: z.string(),
  label: z.string(),
  scope: AxisScope,
  value_scale: AxisScale,
});
export type AxisDef = z.infer<typeof AxisDefSchema>;

/** Eje con su promedio agregado, para el resumen de un local. */
export const AxisRatingSchema = AxisDefSchema.extend({
  average: z.number().nullable(),
  count: z.number().int(),
});
export type AxisRating = z.infer<typeof AxisRatingSchema>;

/** Distribución de estrellas para las barras (Excelente…Malo). */
export const RatingSummarySchema = z.object({
  average: z.number().nullable(),
  count: z.number().int(),
  distribution: z.object({
    excelente: z.number().int(), // 5
    bueno: z.number().int(), // 4
    promedio: z.number().int(), // 3
    malo: z.number().int(), // 1–2
  }),
});
export type RatingSummary = z.infer<typeof RatingSummarySchema>;

/** Valor de un eje dentro de una reseña concreta. */
export const ReviewAxisValueSchema = z.object({
  axis_key: z.string(),
  label: z.string(),
  value: z.number(),
  value_scale: AxisScale,
});
export type ReviewAxisValue = z.infer<typeof ReviewAxisValueSchema>;

/** Reseña de un local/servicio. */
export const ReviewSchema = z.object({
  id: z.string().uuid(),
  author_name: z.string(),
  rating: z.number().nullable(), // media de los ejes 1..5 de esta reseña
  comment: z.string().nullable(),
  created_at: z.string().datetime(),
  axes: z.array(ReviewAxisValueSchema),
});
export type Review = z.infer<typeof ReviewSchema>;
export const ReviewListSchema = paginated(ReviewSchema);
export type ReviewList = z.infer<typeof ReviewListSchema>;

/** Producto (plato/combo) de un local. */
export const ProductSchema = z.object({
  id: z.string().uuid(),
  service_id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: MoneySchema.nullable(),
  image_url: z.string().nullable(),
  is_combo: z.boolean(),
  avg_rating: z.number().nullable(),
  review_count: z.number().int(),
});
export type Product = z.infer<typeof ProductSchema>;

/** Reseña de un producto (plato). */
export const ProductReviewSchema = z.object({
  id: z.string().uuid(),
  product_id: z.string().uuid(),
  author_name: z.string(),
  rating: z.number().nullable(),
  comment: z.string().nullable(),
  created_at: z.string().datetime(),
  axes: z.array(ReviewAxisValueSchema),
});
export type ProductReview = z.infer<typeof ProductReviewSchema>;
export const ProductReviewListSchema = paginated(ProductReviewSchema);
export type ProductReviewList = z.infer<typeof ProductReviewListSchema>;

/** Valor de un eje al escribir una reseña (escala 1..5). */
export const CreateReviewAxisSchema = z.object({
  axis_key: z.string().min(1).max(40),
  value: z.number().min(1).max(5),
});

/** Cuerpo para crear una reseña de producto: POST /v1/products/:id/reviews. */
export const CreateProductReviewSchema = z.object({
  comment: z.string().max(2000).optional(),
  axes: z.array(CreateReviewAxisSchema).min(1),
});
export type CreateProductReview = z.infer<typeof CreateProductReviewSchema>;

/**
 * Cuerpo para crear una reseña de local: POST /v1/services/:id/reviews.
 * `booking_id` es opcional: si se omite, el servidor busca una reserva
 * completada y sin reseña del usuario (la reseña de local exige reserva).
 */
export const CreateVenueReviewSchema = z.object({
  booking_id: z.string().uuid().optional(),
  comment: z.string().max(2000).optional(),
  axes: z.array(CreateReviewAxisSchema).min(1),
});
export type CreateVenueReview = z.infer<typeof CreateVenueReviewSchema>;
