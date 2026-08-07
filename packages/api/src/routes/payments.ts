import { InitiatePaymentSchema } from '@dejatellevar/contracts';
import { handlePaymentTransaction, initiateBookingPayment } from '@dejatellevar/core';
import {
  makeEventPublisher,
  makeLedgerRepository,
  makePaymentBookingRepository,
  makePaymentRepository,
  makePaymentWebhookStore,
  schema,
  systemClock,
} from '@dejatellevar/db';
import { desc, eq } from 'drizzle-orm';
import { Hono } from 'hono';
import type { ApiDeps, ApiEnv } from '../context.js';
import { domainStatus, errorResponse } from '../errors.js';
import { requireAuth } from '../middleware.js';

/** Rutas de pago autenticadas: iniciar pago, consultar, ledger. */
export function paymentsRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;
  const payments = makePaymentRepository(db);
  const bookings = makePaymentBookingRepository(db);
  const events = makeEventPublisher(db);

  app.use('*', requireAuth);

  // POST /v1/payments — inicia el pago de una reserva y devuelve el checkout.
  app.post('/', async (c) => {
    if (!deps.payment) {
      return errorResponse(c, 503, 'PAYMENTS_UNAVAILABLE', 'Los pagos no están configurados aún');
    }
    const accountId = c.get('accountId')!;
    const body = InitiatePaymentSchema.parse(await c.req.json());
    const result = await initiateBookingPayment(
      { bookings, payments, provider: deps.payment, events, clock: systemClock },
      {
        bookingCode: body.booking_code,
        payerAccountId: accountId,
        method: body.method ?? null,
        redirectUrl: body.redirect_url,
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
    const { paymentId, checkout } = result.value;
    return c.json(
      {
        payment_id: paymentId,
        checkout: {
          provider: checkout.provider,
          public_key: checkout.publicKey,
          reference: checkout.reference,
          amount_in_cents: checkout.amountInCents,
          currency: checkout.currency,
          signature: checkout.signature,
          redirect_url: checkout.redirectUrl,
        },
      },
      201,
    );
  });

  // GET /v1/payments/:id
  app.get('/:id', async (c) => {
    const payment = await payments.findById(c.req.param('id'));
    if (!payment) return errorResponse(c, 404, 'NOT_FOUND', 'Pago no encontrado');
    if (
      payment.payerAccountId !== c.get('accountId') &&
      payment.organizationId !== c.get('organizationId')
    ) {
      return errorResponse(c, 403, 'FORBIDDEN', 'No puedes ver este pago');
    }
    return c.json({
      id: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount,
      provider: payment.provider,
      provider_transaction_id: payment.providerTransactionId,
      reference: payment.reference,
    });
  });

  return app;
}

/** GET /v1/ledger — asientos contables de la organización (panel) o del cliente. */
export function ledgerRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;
  app.use('*', requireAuth);

  app.get('/', async (c) => {
    const orgId = c.get('organizationId');
    const accountId = c.get('accountId')!;
    const where = orgId
      ? eq(schema.ledgerEntry.organizationId, orgId)
      : eq(schema.ledgerEntry.accountId, accountId);
    const rows = await db
      .select()
      .from(schema.ledgerEntry)
      .where(where)
      .orderBy(desc(schema.ledgerEntry.occurredAt))
      .limit(100);
    return c.json({
      data: rows.map((r) => ({
        transaction_id: r.transactionId,
        account_type: r.accountType,
        side: r.side,
        amount: { amount: r.amount, currency: r.currency },
        description: r.description,
        booking_id: r.bookingId,
        occurred_at: r.occurredAt.toISOString(),
      })),
    });
  });

  return app;
}

/** POST /webhooks/wompi — PÚBLICO. Verifica firma, idempotencia y procesa. */
export function wompiWebhookRoutes(deps: ApiDeps) {
  const app = new Hono<ApiEnv>();
  const { db } = deps;
  const payments = makePaymentRepository(db);
  const bookings = makePaymentBookingRepository(db);
  const ledger = makeLedgerRepository(db);
  const webhooks = makePaymentWebhookStore(db);
  const events = makeEventPublisher(db);

  app.post('/', async (c) => {
    // Siempre respondemos 200 al PSP para que no reintente en bucle; los problemas
    // se registran en payment_webhook_event.
    if (!deps.payment) return c.json({ ok: true });
    let event: unknown;
    try {
      event = await c.req.json();
    } catch {
      return c.json({ ok: true });
    }

    const parsed = deps.payment.parseWebhook(event);
    if (!parsed) return c.json({ ok: true });
    const valid = deps.payment.verifyWebhookSignature(event);
    const eventType = (event as { event?: string }).event ?? 'transaction.updated';

    const isNew = await webhooks.claim({
      provider: 'wompi',
      providerEventId: parsed.providerEventId,
      eventType,
      signatureValid: valid,
      payload: event as Record<string, unknown>,
    });

    if (!valid) {
      await webhooks.markProcessed(parsed.providerEventId, 'firma inválida');
      return c.json({ ok: true });
    }
    if (!isNew) return c.json({ ok: true }); // evento repetido: ya procesado

    const result = await handlePaymentTransaction(
      { payments, bookings, ledger, events, clock: systemClock },
      parsed.transaction,
    );
    await webhooks.markProcessed(parsed.providerEventId, result.ok ? null : result.error.message);
    return c.json({ ok: true });
  });

  return app;
}
