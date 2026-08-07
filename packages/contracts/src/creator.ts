import { z } from 'zod';
import {
  CreatorAnalysisStatus,
  SocialContentKind,
  SocialLinkStatus,
  SocialNetwork,
} from './enums.js';
import { FidelityScoreSchema } from './fidelity.js';
import { MoneySchema } from './money.js';

/**
 * Perfil de creador expuesto por la API (§12). Las métricas son CALCULADAS
 * (traídas de audiencia verificada y atribución), nunca declaradas por el creador.
 * La fidelidad reutiliza el eje firma del producto (fidelity_index → FidelityScore).
 */
export const CreatorSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  handle: z.string(),
  bio: z.string().nullable(),
  categories: z.array(z.string()),
  cities: z.array(z.string()),
  languages: z.array(z.string()),
  is_accepting_work: z.boolean(),
  // Métricas calculadas
  total_followers: z.number().int(),
  avg_engagement_rate: z.number().nullable(),
  fidelity: FidelityScoreSchema,
  conversion_rate: z.number().nullable(),
  total_attributed_gmv: MoneySchema,
  on_time_delivery_rate: z.number().nullable(),
  avg_revision_rounds: z.number().nullable(),
  created_at: z.string().datetime(),
});
export type Creator = z.infer<typeof CreatorSchema>;

/** Filtros para descubrir creadores: GET /v1/creators. */
export const CreatorSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  city: z.string().optional(),
  accepting: z.coerce.boolean().optional(),
  fidelity_min: z.coerce.number().min(-3).max(3).optional(),
  sort: z
    .enum(['relevance', 'followers', 'fidelity', 'engagement', 'conversion'])
    .default('relevance'),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type CreatorSearch = z.infer<typeof CreatorSearchSchema>;

// --- Registro de creador y análisis de contenido (§12) ----------------------

/**
 * Enlace público a una red social del creador. Es la ENTRADA del scraping: de
 * aquí se descubre el contenido para transcribir, contar vistas y clasificar.
 */
export const SocialLinkSchema = z.object({
  network: SocialNetwork,
  url: z.string().url('URL inválida').max(500),
});
export type SocialLink = z.infer<typeof SocialLinkSchema>;

/**
 * Alta de creador (autoservicio, vista M-creator). El creador DECLARA metadatos y
 * enlaces; las métricas finas (categoría, audiencia, vistas) se CALCULAN del
 * análisis de contenido, nunca se declaran.
 */
export const RegisterCreatorSchema = z.object({
  handle: z
    .string()
    .min(3, 'El @ debe tener al menos 3 caracteres')
    .max(60)
    .regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, números, punto, guion y guion bajo'),
  bio: z.string().max(500).optional(),
  categories: z.array(z.string().max(60)).max(10).default([]),
  cities: z.array(z.string().max(80)).max(20).default([]),
  social_links: z.array(SocialLinkSchema).min(1, 'Agrega al menos un enlace de red social').max(6),
  // Ley 1581: transcribir y clasificar su contenido con IA requiere consentimiento explícito.
  accept_ai_processing: z.literal(true, {
    errorMap: () => ({
      message: 'Debes autorizar el análisis de tu contenido para registrarte como creador',
    }),
  }),
});
export type RegisterCreator = z.infer<typeof RegisterCreatorSchema>;

/** Enlace social tal como lo devuelve la API, con su estado de análisis. */
export const CreatorSocialLinkSchema = z.object({
  id: z.string().uuid(),
  network: SocialNetwork,
  url: z.string(),
  handle: z.string().nullable(),
  status: SocialLinkStatus,
  last_analyzed_at: z.string().datetime().nullable(),
});
export type CreatorSocialLink = z.infer<typeof CreatorSocialLinkSchema>;

/** Una pieza de contenido raspada y transcrita: el dato de valor por ítem. */
export const AnalyzedContentItemSchema = z.object({
  id: z.string().uuid(),
  network: SocialNetwork,
  kind: SocialContentKind,
  url: z.string(),
  title: z.string().nullable(),
  views: z.number().int().nonnegative(),
  likes: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  shares: z.number().int().nonnegative(),
  duration_seconds: z.number().int().nonnegative().nullable(),
  published_at: z.string().datetime().nullable(),
  transcript: z.string().nullable(),
  language: z.string().nullable(),
  topics: z.array(z.string()),
});
export type AnalyzedContentItem = z.infer<typeof AnalyzedContentItemSchema>;

/** Audiencia derivada del contenido (no declarada). */
export const CreatorAudienceSchema = z.object({
  primary_age_range: z.string().nullable(),
  top_cities: z.array(z.string()),
  languages: z.array(z.string()),
  interests: z.array(z.string()),
});
export type CreatorAudience = z.infer<typeof CreatorAudienceSchema>;

/**
 * Insight agregado del creador: el resultado comercial del scraping. Categoría
 * sugerida, audiencia, vistas y temas se calculan de las piezas analizadas.
 */
export const CreatorInsightSchema = z.object({
  status: CreatorAnalysisStatus,
  analyzed_at: z.string().datetime().nullable(),
  items_analyzed: z.number().int().nonnegative(),
  total_views: z.number().int().nonnegative(),
  avg_views: z.number().nonnegative(),
  avg_engagement_rate: z.number().nullable(),
  suggested_categories: z.array(z.string()),
  top_topics: z.array(z.string()),
  audience: CreatorAudienceSchema,
  brand_safety: z.enum(['safe', 'review', 'unsafe']),
  networks: z.array(
    z.object({
      network: SocialNetwork,
      followers: z.number().int().nonnegative(),
      avg_views: z.number().nonnegative(),
      items: z.number().int().nonnegative(),
    }),
  ),
});
export type CreatorInsight = z.infer<typeof CreatorInsightSchema>;

/** Perfil de creador del titular (GET /v1/creators/me): metadatos + enlaces + insight. */
export const MyCreatorSchema = z.object({
  id: z.string().uuid(),
  account_id: z.string().uuid(),
  handle: z.string(),
  bio: z.string().nullable(),
  categories: z.array(z.string()),
  cities: z.array(z.string()),
  languages: z.array(z.string()),
  is_accepting_work: z.boolean(),
  total_followers: z.number().int(),
  avg_engagement_rate: z.number().nullable(),
  fidelity_index: z.number().nullable(),
  created_at: z.string().datetime(),
  social_links: z.array(CreatorSocialLinkSchema),
  insight: CreatorInsightSchema.nullable(),
});
export type MyCreator = z.infer<typeof MyCreatorSchema>;
