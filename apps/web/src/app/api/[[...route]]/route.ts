import { getApiApp } from '@/server/api';
import { handle } from 'hono/vercel';

/**
 * Monta la API de Hono en Next (§9). Todas las rutas /api/* pasan por la misma
 * app que consumen las páginas en proceso.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const app = getApiApp();

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const PUT = handle(app);
