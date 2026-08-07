import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

/**
 * Cliente de base de datos: postgres-js + Drizzle sobre Postgres ESTÁNDAR.
 * No usamos el cliente de Supabase (regla de oro de portabilidad).
 */
export function createDbClient(connectionString: string, opts?: { max?: number }) {
  const sql = postgres(connectionString, {
    max: opts?.max ?? 10,
    // Almacenamiento en UTC; presentación en America/Bogota en la capa de UI.
    types: {},
  });
  const db = drizzle(sql, { schema });
  return { db, sql };
}

export type DbClient = ReturnType<typeof createDbClient>['db'];
export type Sql = ReturnType<typeof createDbClient>['sql'];
