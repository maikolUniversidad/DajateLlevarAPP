import { z } from 'zod';
import { AccessibilityProfileSchema } from './accessibility.js';
import {
  CancellationPolicy,
  LocationMode,
  PricingMode,
  RiskCategory,
  ServiceModality,
  ServiceStatus,
} from './enums.js';
import { FidelityScoreSchema } from './fidelity.js';
import { MoneySchema } from './money.js';
import { AxisDefSchema, AxisRatingSchema, ProductSchema, RatingSummarySchema } from './review.js';

/** Representación de un servicio expuesta por la API (§8.1). */
export const ServiceSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  short_description: z.string().nullable(),
  description: z.string(),
  category_id: z.string().uuid(),
  modality: ServiceModality,
  status: ServiceStatus,
  pricing_mode: PricingMode,
  base_price: MoneySchema.nullable(),
  price_per: z.string(),
  duration_minutes: z.number().int().nullable(),
  min_participants: z.number().int(),
  max_participants: z.number().int().nullable(),
  location_mode: LocationMode,
  city: z.string().nullable(),
  department: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
  cancellation_policy: CancellationPolicy,
  risk_category: RiskCategory,
  requires_waiver: z.boolean(),
  accessibility: AccessibilityProfileSchema,
  avg_rating: z.number().nullable(),
  fidelity: FidelityScoreSchema,
  review_count: z.number().int(),
  published_at: z.string().datetime().nullable(),
});
export type Service = z.infer<typeof ServiceSchema>;

/**
 * Detalle de un servicio/local: GET /v1/services/:id. Enriquece al servicio con
 * los datos de la ficha: precio por persona, si requiere reserva, resumen de
 * calificación, ejes de local (con promedio), definición de ejes de plato y la
 * lista de productos.
 */
export const ServiceDetailSchema = ServiceSchema.extend({
  requires_reservation: z.boolean(),
  avg_price_per_person: MoneySchema.nullable(),
  rating_summary: RatingSummarySchema,
  axes: z.array(AxisRatingSchema),
  product_axes: z.array(AxisDefSchema),
  products: z.array(ProductSchema),
});
export type ServiceDetail = z.infer<typeof ServiceDetailSchema>;

/** Filtros de búsqueda de servicios: GET /v1/services (§8.1). */
export const ServiceSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  date: z.string().optional(),
  price_min: z.coerce.number().int().nonnegative().optional(),
  price_max: z.coerce.number().int().nonnegative().optional(),
  accessibility: z.string().optional(), // csv de dimensiones requeridas
  fidelity_min: z.coerce.number().min(-3).max(3).optional(),
  sort: z
    .enum(['relevance', 'price_asc', 'price_desc', 'fidelity', 'rating', 'newest'])
    .default('relevance'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ServiceSearch = z.infer<typeof ServiceSearchSchema>;

/** Cuerpo para crear un servicio: POST /v1/services (§8.1). */
export const CreateServiceSchema = z
  .object({
    organization_id: z.string().uuid(),
    name: z.string().min(3).max(160),
    short_description: z.string().max(280).optional(),
    description: z.string().min(1),
    category_id: z.string().uuid(),
    modality: ServiceModality,
    pricing_mode: PricingMode.default('fixed'),
    base_price: MoneySchema.optional(),
    price_per: z.string().default('person'),
    duration_minutes: z.number().int().positive().optional(),
    min_participants: z.number().int().positive().default(1),
    max_participants: z.number().int().positive().optional(),
    location_mode: LocationMode.default('on_site'),
    city: z.string().optional(),
    department: z.string().optional(),
    cancellation_policy: CancellationPolicy.default('moderate'),
    risk_category: RiskCategory.default('none'),
    accessibility: AccessibilityProfileSchema.default({}),
  })
  .refine((s) => (s.pricing_mode === 'quote_only' ? !s.base_price : !!s.base_price), {
    message: 'quote_only no lleva precio; los demás modos requieren base_price',
    path: ['base_price'],
  });
export type CreateService = z.infer<typeof CreateServiceSchema>;
