import { z } from 'zod';
import { RiskCategory } from './enums.js';

/**
 * Categoría/actividad del catálogo (§4). Taxonomía jerárquica: `parent_id`
 * apunta a la categoría madre (null en la raíz). Es la fuente del filtro de
 * "actividades" en el descubrimiento y de los chips del home.
 */
export const CategorySchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  parent_id: z.string().uuid().nullable(),
  icon: z.string().nullable(),
  risk_category: RiskCategory,
  sort_order: z.number().int(),
});
export type Category = z.infer<typeof CategorySchema>;

/** Respuesta de GET /v1/categories. Lista completa, sin paginación. */
export const CategoryListSchema = z.object({
  data: z.array(CategorySchema),
});
export type CategoryList = z.infer<typeof CategoryListSchema>;
