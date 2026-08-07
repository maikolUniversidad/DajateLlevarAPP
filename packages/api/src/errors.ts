import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

/** Respuesta de error uniforme (§8.2): { error: { code, message, details? } }. */
export function errorResponse(
  c: Context,
  status: ContentfulStatusCode,
  code: string,
  message: string,
  details?: unknown,
) {
  return c.json({ error: { code, message, ...(details ? { details } : {}) } }, status);
}

const DOMAIN_STATUS: Record<string, ContentfulStatusCode> = {
  SERVICE_NOT_FOUND: 404,
  SERVICE_NOT_PUBLISHED: 409,
  RESOURCE_UNAVAILABLE: 409,
  DOUBLE_BOOKING: 409,
  WAIVER_REQUIRED: 422,
  INSURANCE_REQUIRED: 422,
  RNT_REQUIRED: 422,
  INVALID_PARTICIPANTS: 422,
  ADVANCE_WINDOW: 422,
  NOT_AUTHORIZED: 403,
  PRICING_INVALID: 422,
  ACCOUNT_NOT_FOUND: 404,
  CREATOR_NOT_FOUND: 404,
  CREATOR_PROFILE_EXISTS: 409,
  HANDLE_TAKEN: 409,
  NO_SOCIAL_LINKS: 422,
  CONSENT_REQUIRED: 422,
  POLICY_NOT_CONFIGURED: 422,
  SCRAPING_FAILED: 502,
  ORGANIZATION_NOT_FOUND: 404,
  CAMPAIGN_NOT_FOUND: 404,
  NOT_CAMPAIGN_OWNER: 403,
  CREATOR_NOT_ACCEPTING: 409,
  ALREADY_INVITED: 409,
};

export function domainStatus(code: string): ContentfulStatusCode {
  return DOMAIN_STATUS[code] ?? 400;
}

/** Manejador global: convierte Zod y errores inesperados al formato uniforme. */
export function onError(err: Error, c: Context) {
  if (err instanceof ZodError) {
    return errorResponse(
      c,
      422,
      'VALIDATION_ERROR',
      'Los datos enviados no son válidos',
      err.issues,
    );
  }
  console.error('[api] error no controlado:', err);
  return errorResponse(c, 500, 'INTERNAL_ERROR', 'Ocurrió un error inesperado');
}
