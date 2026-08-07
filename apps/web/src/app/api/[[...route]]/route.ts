import { getApiApp } from '@/server/api';
import { handle } from 'hono/vercel';

/**
 * Monta la API de Hono en Next (§9). La app (y el cliente de BD) se construye
 * de forma PEREZOSA dentro del handler, no al importar el módulo: así `next build`
 * no falla cuando aún no hay DATABASE_URL en el entorno de compilación.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function handler(req: Request) {
  return handle(getApiApp())(req);
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE, handler as PUT };
