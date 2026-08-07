import 'server-only';
import { type ApiApp, createApiApp } from '@dejatellevar/api';
import { type DbClient, createDbClient } from '@dejatellevar/db';

/**
 * Instancia única del cliente de BD y de la app de API para el servidor de Next.
 * Las páginas consumen la API REAL en proceso (sin salto de red) vía `app.request`.
 */
declare global {
  // eslint-disable-next-line no-var
  var __dl_db: DbClient | undefined;
  // eslint-disable-next-line no-var
  var __dl_api: ApiApp | undefined;
}

function getDb(): DbClient {
  if (!globalThis.__dl_db) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('Falta DATABASE_URL');
    globalThis.__dl_db = createDbClient(url).db;
  }
  return globalThis.__dl_db;
}

export function getApiApp(): ApiApp {
  if (!globalThis.__dl_api) {
    globalThis.__dl_api = createApiApp({ db: getDb() });
  }
  return globalThis.__dl_api;
}

/** Llama a la API en proceso y devuelve el JSON tipado. `path` empieza en /v1. */
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // La app monta en basePath '/api'; se antepone para que el enrutado coincida.
  const res = await getApiApp().request(`/api${path}`, init);
  if (!res.ok) {
    throw new Error(`API ${path} respondió ${res.status}`);
  }
  return (await res.json()) as T;
}
