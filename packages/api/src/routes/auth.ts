import { LoginSchema, RegisterSchema } from '@dejatellevar/contracts';
import { registerAccount } from '@dejatellevar/core';
import {
  makeAccountRepository,
  makeConsentRepository,
  makeEventPublisher,
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

  // POST /register — alta con consentimiento probatorio (Ley 1581)
  app.post('/register', async (c) => {
    const body = RegisterSchema.parse(await c.req.json());
    const evidence = {
      ipAddress:
        c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ?? c.req.header('x-real-ip') ?? null,
      userAgent: c.req.header('user-agent') ?? null,
    };

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

    // Inicia sesión automáticamente tras el registro.
    const signIn = await deps.auth.signIn({ email: body.email, password: body.password });
    if (signIn) {
      setCookie(c, SESSION_COOKIE, signIn.token, sessionCookieOptions());
    }

    return c.json(
      {
        account: {
          id: result.value.id,
          email: result.value.email,
          full_name: result.value.fullName,
        },
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
