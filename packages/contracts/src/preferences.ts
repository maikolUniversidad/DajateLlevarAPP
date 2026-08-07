import { z } from 'zod';
import { RiskCategory } from './enums.js';

/**
 * Preferencias de gustos del CLIENTE (test de onboarding). Se guardan en
 * client_profile.preferences (jsonb) y personalizan búsqueda e inicio.
 *
 * NO son datos sensibles: la accesibilidad (Ley 1581) va por otro camino
 * (client_profile.accessibility_needs + consentimiento sensitive_accessibility).
 */

/** Banda de presupuesto declarada por el cliente. */
export const PriceBand = z.enum(['economico', 'moderado', 'premium', 'flexible']);
export type PriceBand = z.infer<typeof PriceBand>;

/** Con quién suele disfrutar los servicios. */
export const CompanyKind = z.enum(['solo', 'pareja', 'familia', 'amigos']);
export type CompanyKind = z.infer<typeof CompanyKind>;

/** Para qué / qué ocasión busca. */
export const OccasionKind = z.enum([
  'relax',
  'aventura',
  'celebracion',
  'gastronomia',
  'aprendizaje',
  'cultura',
]);
export type OccasionKind = z.infer<typeof OccasionKind>;

/** Datos que el cliente envía al guardar el test (PUT /v1/me/preferences). */
export const UpdateClientPreferencesSchema = z.object({
  /** Slugs de categorías de interés (tabla category). */
  interests: z.array(z.string().max(60)).max(20).default([]),
  budget: PriceBand.default('flexible'),
  /** Ciudades donde suele buscar. */
  cities: z.array(z.string().max(80)).max(20).default([]),
  company: z.array(CompanyKind).max(4).default([]),
  occasions: z.array(OccasionKind).max(6).default([]),
});
export type UpdateClientPreferences = z.infer<typeof UpdateClientPreferencesSchema>;

/** Preferencias tal como las devuelve la API (GET /v1/me/preferences). */
export const ClientPreferencesSchema = UpdateClientPreferencesSchema.extend({
  /** ISO 8601; null si el cliente aún no completó el test. */
  completed_at: z.string().datetime().nullable().default(null),
});
export type ClientPreferences = z.infer<typeof ClientPreferencesSchema>;

/** Categoría del catálogo (GET /v1/categories), fuente de las opciones de interés. */
export const CategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name_es: z.string(),
  icon: z.string().nullable(),
  risk_category: RiskCategory,
});
export type Category = z.infer<typeof CategorySchema>;
