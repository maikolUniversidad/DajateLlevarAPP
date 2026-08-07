import { z } from 'zod';

/**
 * Validación de variables de entorno con Zod.
 *
 * Regla innegociable #7: si falta una variable requerida, la app NO levanta.
 * Cada módulo importa `serverEnv()` / `clientEnv()` y falla ruidosamente al
 * arrancar en lugar de reventar en tiempo de ejecución con un `undefined`.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.string().url().default('http://localhost:3000'),
  API_URL: z.string().url().default('http://localhost:3000/api'),

  // Base de datos
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  DATABASE_URL_DIRECT: z.string().min(1).optional(),

  // Supabase (adaptadores Auth + Storage)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_DB_PASSWORD: z.string().optional(),

  // Cifrado y sesión
  ENCRYPTION_KEY: z.string().min(16, 'ENCRYPTION_KEY debe tener al menos 16 caracteres'),
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET debe tener al menos 16 caracteres'),

  // Pagos (Wompi)
  WOMPI_PUBLIC_KEY: z.string().optional(),
  WOMPI_PRIVATE_KEY: z.string().optional(),
  WOMPI_EVENTS_SECRET: z.string().optional(),
  WOMPI_INTEGRITY_SECRET: z.string().optional(),

  // IA
  AI_GATEWAY_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal('')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;

let cachedServer: ServerEnv | null = null;

export function serverEnv(source: NodeJS.ProcessEnv = process.env): ServerEnv {
  if (cachedServer) return cachedServer;
  const parsed = serverSchema.safeParse(source);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Variables de entorno inválidas o faltantes:\n${issues}`);
  }
  cachedServer = parsed.data;
  return cachedServer;
}

export function clientEnv(source: Record<string, string | undefined>): ClientEnv {
  return clientSchema.parse(source);
}
