import {
  ClientPreferencesSchema,
  DataRequestSchema,
  GrantConsentSchema,
  UpdateClientPreferencesSchema,
  UpdateMeSchema,
} from '@dejatellevar/contracts';
import { computeVerificationLevel } from '@dejatellevar/core';
import {
  makeAccountRepository,
  makeConsentRepository,
  makeCreatorRepository,
  makeDataSubjectRequestRepository,
  makeMembershipRepository,
  makePolicyVersionRepository,
  schema,
} from '@dejatellevar/db';
import { eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';
import { errorResponse } from '../errors.js';
import { requireAuth } from '../middleware.js';

export function meRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;
  const accounts = makeAccountRepository(db);
  const consents = makeConsentRepository(db);
  const policies = makePolicyVersionRepository(db);
  const dataRequests = makeDataSubjectRequestRepository(db);
  const creators = makeCreatorRepository(db);
  const memberships = makeMembershipRepository(db);

  app.use('*', requireAuth);

  // GET /me — perfil + nivel de verificación (función pura del dominio)
  app.get('/', async (c) => {
    const id = c.get('accountId')!;
    const rows = await db.select().from(schema.account).where(eq(schema.account.id, id)).limit(1);
    const r = rows[0];
    if (!r) return errorResponse(c, 404, 'ACCOUNT_NOT_FOUND', 'Cuenta no encontrada');

    const v = computeVerificationLevel({
      account: {
        emailVerifiedAt: r.emailVerifiedAt,
        phoneVerifiedAt: r.phoneVerifiedAt,
        documentVerifiedAt: r.documentVerifiedAt,
      },
    });

    // Perfiles activables (§10.1): Cliente siempre; Creador y Empresa según existan.
    const [creatorProfile, orgs] = await Promise.all([
      creators.findByAccountId(id),
      memberships.findByAccountId(id),
    ]);

    return c.json({
      id: r.id,
      email: r.email,
      full_name: r.fullName,
      display_name: r.displayName,
      phone: r.phone,
      email_verified: !!r.emailVerifiedAt,
      phone_verified: !!r.phoneVerifiedAt,
      document_verified: !!r.documentVerifiedAt,
      verification_level: v.level,
      verification_next: v.next,
      verification_missing: v.missingForNext,
      city: r.city,
      department: r.department,
      profiles: {
        client: true as const,
        creator: !!creatorProfile,
        organizations: orgs.map((o) => ({
          id: o.organizationId,
          trade_name: o.tradeName,
          role: o.role,
        })),
      },
    });
  });

  // PATCH /me
  app.patch('/', async (c) => {
    const id = c.get('accountId')!;
    const body = UpdateMeSchema.parse(await c.req.json());
    const updated = await accounts.update(id, {
      fullName: body.full_name,
      displayName: body.display_name,
      phone: body.phone,
      city: body.city,
      department: body.department,
    });
    return c.json({ id: updated.id, full_name: updated.fullName });
  });

  // GET /me/consents — estado actual por propósito
  app.get('/consents', async (c) => {
    const id = c.get('accountId')!;
    const current = await consents.currentFor(id);
    return c.json({
      data: current.map((s) => ({
        purpose: s.purpose,
        granted: s.granted,
        granted_at: s.grantedAt ? s.grantedAt.toISOString() : null,
        revoked_at: s.revokedAt ? s.revokedAt.toISOString() : null,
        policy_version: s.policyVersion,
      })),
    });
  });

  // POST /me/consents — otorgar o revocar (con prueba: IP + user agent)
  app.post('/consents', async (c) => {
    const id = c.get('accountId')!;
    const body = GrantConsentSchema.parse(await c.req.json());
    const policy = await policies.latestFor(body.purpose);
    if (!policy) {
      return errorResponse(
        c,
        422,
        'POLICY_NOT_CONFIGURED',
        'No hay política publicada para ese propósito',
      );
    }
    await consents.record({
      accountId: id,
      policyVersionId: policy.id,
      purpose: body.purpose,
      granted: body.granted,
      evidence: {
        ipAddress:
          c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ??
          c.req.header('x-real-ip') ??
          null,
        userAgent: c.req.header('user-agent') ?? null,
      },
    });
    return c.json({ ok: true, purpose: body.purpose, granted: body.granted });
  });

  // POST /me/data-requests — derechos del titular (exportación, supresión)
  app.post('/data-requests', async (c) => {
    const id = c.get('accountId')!;
    const body = DataRequestSchema.parse(await c.req.json());
    const created = await dataRequests.create({
      accountId: id,
      kind: body.kind,
      notes: body.notes,
    });
    // La supresión efectiva es un flujo operativo; aquí queda registrada la solicitud.
    if (body.kind === 'delete') {
      await accounts.softDelete(id);
    }
    return c.json({ id: created.id, status: created.status, kind: body.kind }, 202);
  });

  // GET /me/preferences — test de gustos del cliente (para personalizar). Devuelve
  // valores por defecto si aún no lo completó (parse rellena los faltantes).
  app.get('/preferences', async (c) => {
    const id = c.get('accountId')!;
    const rows = await db
      .select({ preferences: schema.clientProfile.preferences })
      .from(schema.clientProfile)
      .where(eq(schema.clientProfile.accountId, id))
      .limit(1);
    const stored = (rows[0]?.preferences ?? {}) as Record<string, unknown>;
    return c.json(ClientPreferencesSchema.parse(stored));
  });

  // PUT /me/preferences — guarda el test de gustos. No es dato sensible (Ley 1581):
  // la accesibilidad va por otro campo/consentimiento aparte.
  app.put('/preferences', async (c) => {
    const id = c.get('accountId')!;
    const body = UpdateClientPreferencesSchema.parse(await c.req.json());
    const preferences = { ...body, completed_at: new Date().toISOString() };
    await db
      .update(schema.clientProfile)
      .set({ preferences, updatedAt: new Date() })
      .where(eq(schema.clientProfile.accountId, id));
    return c.json(ClientPreferencesSchema.parse(preferences));
  });

  return app;
}
