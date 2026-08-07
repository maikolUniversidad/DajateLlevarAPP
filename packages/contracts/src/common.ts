import { z } from 'zod';

/** Paginación por cursor (§8.2). */
export const PaginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    next_cursor: z.string().nullable(),
  });
}

/** Dirección postal / ubicación (Colombia). */
export const AddressSchema = z.object({
  address: z.string().optional(),
  city: z.string().min(1),
  department: z.string().min(1),
  country: z.string().length(2).default('CO'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type Address = z.infer<typeof AddressSchema>;

/** Error uniforme de la API (§8.2). Códigos en SCREAMING_SNAKE_CASE. */
export const ApiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

export const UuidSchema = z.string().uuid();
