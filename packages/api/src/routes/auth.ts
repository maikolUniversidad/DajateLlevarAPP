import { LoginSchema, RegisterSchema } from '@dejatellevar/contracts';
import {
  activateBusinessProfile,
  activateCreatorProfile,
  connectSocialLinks,
  registerAccount,
} from '@dejatellevar/core';
import {
  makeAccountRepository,
  makeConsentRepository,
  makeCreatorContentRepository,
  makeCreatorRepository,
  makeEventPublisher,
  makeOrganizationRepository,
  makePolicyVersionRepository,
  systemClock,
} from '@dejatellevar/db';
import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import type { ApiDeps, ApiEnv } from '../context.js';
import { domainStatus, errorResponse } from '../errors.js';
import { SESSION_COOKIE } from '../middleware.js';

function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 días
  };
}

export function authRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const accounts = makeAccountRepository(deps.db);
  const policies = makePolicyVersionRepository(deps.db);
  const consents = makeConsentRepository(deps.db);
  const events = makeEventPublisher(deps.db);
  const organizations = makeOrganizationRepository(deps.db);
  const creators = makeCreatorRepository(deps.db);
  const creatorContent = makeCreatorContentRepository(deps.db);

  // POST /register — alta con consentimiento probatorio (Ley 1581).
  // Una sola identidad con perfiles activables (§10.1): Cliente siempre activo;
  // Empresa y Creador traen sus datos inline y se activan en el mismo registro.
  app.post('/register', async (c) => {
    const body = RegisterSchema.parse(await c.req.json());
    const evidence = {
      ipAddress:
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? null,
      userAgent: c.req.header('user-agent') ?? null,
    };

    // Pre-chequeos: no creamos la cuenta si el perfil proveedor colisiona (evita
    // dejar una cuenta a medio activar). La activación reverifica de forma atómica.
    if (body.profile_type === 'business' && body.business) {
      if (await organizations.existsByTaxId(body.business.tax_id)) {
        return errorResponse(
          c,
          domainStatus('TAX_ID_TAKEN'),
          'TAX_ID_TAKEN',
          'Ya existe una empresa con ese NIT',
        );
      }
    }
    if (body.profile_type === 'creator' && body.creator) {
      if (await creators.findByHandle(body.creator.handle)) {
        return errorResponse(
          c,
          domainStatus('HANDLE_TAKEN'),
          'HANDLE_TAKEN',
          'Ese usuario de creador ya está tomado',
        );
      }
    }

    const result = await registerAccount(
      { auth: deps.auth, accounts, policies, consents, events, clock: systemClock },
      {
        email: body.email,
        password: body.password,
        fullName: body.full_name,
        phone: body.phone ?? null,
        acceptMarketing: body.accept_marketing,
        evidence,
      },
    );

    if (!result.ok) {
      return errorResponse(
        c,
        domainStatus(result.error.code),
        result.error.code,
        result.error.message,
      );
    }
    const account = result.value;

    // Perfiles activados en el alta. Cliente siempre activo.
    let organization: { id: string; trade_name: string } | null = null;
    let creator: { id: string; handle: string } | null = null;

    if (body.profile_type === 'business' && body.business) {
      const activated = await activateBusinessProfile(
        { accounts, organizations, events },
        {
          accountId: account.id,
          legalName: body.business.legal_name,
          tradeName: body.business.trade_name,
          taxId: body.business.tax_id,
          tourismRegistry: body.business.tourism_registry ?? null,
          sector: body.business.sector ?? null,
          email: body.business.email ?? null,
          phone: body.business.phone,
          city: body.business.city,
          department: body.business.department,
          sedes: body.business.sedes ?? [],
        },
      );
      if (!activated.ok) {
        return errorResponse(
          c,
          domainStatus(activated.error.code),
          activated.error.code,
          activated.error.message,
        );
      }
      organization = { id: activated.value.id, trade_name: activated.value.tradeName };
    } else if (body.profile_type === 'creator' && body.creator) {
      // Onboarding de creador inline: activa el perfil y conecta las redes para el
      // análisis con IA (registra el consentimiento ai_processing, Ley 1581).
      const activated = await activateCreatorProfile(
        { accounts, creators, events },
        {
          accountId: account.id,
          handle: body.creator.handle,
          bio: body.creator.bio ?? null,
          categories: body.creator.categories,
          cities: body.creator.cities,
        },
      );
      if (!activated.ok) {
        return errorResponse(
          c,
          domainStatus(activated.error.code),
          activated.error.code,
          activated.error.message,
        );
      }
      const linked = await connectSocialLinks(
        { creators, content: creatorContent, policies, consents, events },
        {
          accountId: account.id,
          socialLinks: body.creator.social_links,
          evidence,
        },
      );
      if (!linked.ok) {
        return errorResponse(
          c,
          domainStatus(linked.error.code),
          linked.error.code,
          linked.error.message,
        );
      }
      creator = { id: activated.value.id, handle: activated.value.handle };
    }

    // Inicia sesión automáticamente tras el registro.
    const signIn = await deps.auth.signIn({ email: body.email, password: body.password });
    if (signIn) {
      setCookie(c, SESSION_COOKIE, signIn.token, sessionCookieOptions());
    }

    return c.json(
      {
        account: {
          id: account.id,
          email: account.email,
          full_name: account.fullName,
        },
        profile_type: body.profile_type,
        organization,
        creator,
        needs_email_verification: !signIn,
      },
      201,
    );
  });

  // POST /login
  app.post('/login', async (c) => {
    const body = LoginSchema.parse(await c.req.json());
    const signIn = await deps.auth.signIn({ email: body.email, password: body.password });
    if (!signIn) {
      return errorResponse(c, 401, 'INVALID_CREDENTIALS', 'Correo o contraseña incorrectos');
    }
    setCookie(c, SESSION_COOKIE, signIn.token, sessionCookieOptions());
    return c.json({ ok: true });
  });

  // POST /logout
  app.post('/logout', (c) => {
    setCookie(c, SESSION_COOKIE, '', { ...sessionCookieOptions(), maxAge: 0 });
    return c.json({ ok: true });
  });

  return app;
}
