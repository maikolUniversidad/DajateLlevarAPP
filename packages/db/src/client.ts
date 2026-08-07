import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

/**
 * Cliente de base de datos: postgres-js + Drizzle sobre Postgres ESTÁNDAR.
 * No usamos el cliente de Supabase (regla de oro de portabilidad).
 *
 * `prepare: false` por defecto: el pooler de Supabase (pgbouncer en modo
 * transacción, puerto 6543) no soporta prepared statements. Desactivarlos hace
 * el cliente compatible tanto con el pooler como con la conexión directa.
 */
export function createDbClient(
  connectionString: string,
  opts?: { max?: number; prepare?: boolean },
) {
  const sql = postgres(connectionString, {
    max: opts?.max ?? 10,
    prepare: opts?.prepare ?? false,
    // Almacenamiento en UTC; presentación en America/Bogota en la capa de UI.
    types: {},
  });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export type DbClient = ReturnType<typeof createDbClient>['db'];
export type Sql = ReturnType<typeof createDbClient>['sql'];
