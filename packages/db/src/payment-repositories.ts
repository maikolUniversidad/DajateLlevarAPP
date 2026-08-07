import type {
  BookingForPayment,
  LedgerEntryDraft,
  LedgerRepository,
  PaymentBookingRepository,
  PaymentRecord,
  PaymentRepository,
  PaymentWebhookStore,
} from '@dejatellevar/core';
import { type SQL, eq } from 'drizzle-orm';
import type { DbClient } from './client.js';
import * as s from './schema.js';

/** Genera una referencia única para el PSP (alfanumérica, sin ambigüedades). */
function newReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'DLPAY';
  for (let i = 0; i < 12; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function mapPayment(r: typeof s.payment.$inferSelect): PaymentRecord {
  return {
    id: r.id,
    bookingId: r.bookingId,
    organizationId: r.organizationId,
    payerAccountId: r.payerAccountId,
    status: r.status,
    method: r.method,
    amount: { amount: r.amount, currency: r.currency as 'COP' | 'USD' },
    provider: r.provider,
    providerTransactionId: r.providerTransactionId,
    // La referencia del PSP se guarda en idempotency_key (único).
    reference: r.idempotencyKey ?? '',
  };
}

export function makePaymentRepository(db: DbClient): PaymentRepository {
  return {
    async create(input) {
      const reference = newReference();
      const inserted = await db
        .insert(s.payment)
        .values({
          bookingId: input.bookingId,
          organizationId: input.organizationId,
          payerAccountId: input.payerAccountId,
          status: 'created',
          method: input.method ?? null,
          amount: input.amount.amount,
          currency: input.amount.currency,
          provider: input.provider,
          idempotencyKey: reference,
        })
        .returning();
      return mapPayment(inserted[0]!);
    },
    async findById(id) {
      const rows = await db.select().from(s.payment).where(eq(s.payment.id, id)).limit(1);
      return rows[0] ? mapPayment(rows[0]) : null;
    },
    async findByReference(reference) {
      const rows = await db
        .select()
        .from(s.payment)
        .where(eq(s.payment.idempotencyKey, reference))
        .limit(1);
      return rows[0] ? mapPayment(rows[0]) : null;
    },
    async markStatus({ id, status, providerTransactionId, method, heldAt }) {
      await db
        .update(s.payment)
        .set({
          status: status as typeof s.payment.$inferInsert.status,
          ...(providerTransactionId !== undefined ? { providerTransactionId } : {}),
          ...(method !== undefined ? { method } : {}),
          ...(heldAt !== undefined ? { heldAt } : {}),
          updatedAt: new Date(),
        })
        .where(eq(s.payment.id, id));
    },
  };
}

export function makeLedgerRepository(db: DbClient): LedgerRepository {
  return {
    async hasTransaction(transactionId) {
      const rows = await db
        .select({ id: s.ledgerEntry.id })
        .from(s.ledgerEntry)
        .where(eq(s.ledgerEntry.transactionId, transactionId))
        .limit(1);
      return rows.length > 0;
    },
    async recordTransaction(transactionId, entries: LedgerEntryDraft[]) {
      await db.insert(s.ledgerEntry).values(
        entries.map((e) => ({
          transactionId,
          accountType: e.accountType as typeof s.ledgerEntry.$inferInsert.accountType,
          side: e.side as typeof s.ledgerEntry.$inferInsert.side,
          amount: e.amount,
          organizationId: e.organizationId ?? null,
          accountId: e.accountId ?? null,
          bookingId: e.bookingId ?? null,
          paymentId: e.paymentId ?? null,
          taxKind: e.taxKind ?? null,
          taxRate: e.taxRate != null ? String(e.taxRate) : null,
          description: e.description,
        })),
      );
    },
  };
}

export function makePaymentWebhookStore(db: DbClient): PaymentWebhookStore {
  return {
    async claim({ provider, providerEventId, eventType, signatureValid, payload }) {
      const inserted = await db
        .insert(s.paymentWebhookEvent)
        .values({ provider, providerEventId, eventType, signatureValid, payload })
        .onConflictDoNothing({
          target: [s.paymentWebhookEvent.provider, s.paymentWebhookEvent.providerEventId],
        })
        .returning({ id: s.paymentWebhookEvent.id });
      return inserted.length > 0; // true = evento nuevo (procesar)
    },
    async markProcessed(providerEventId, error) {
      await db
        .update(s.paymentWebhookEvent)
        .set({ processedAt: new Date(), processingError: error ?? null })
        .where(eq(s.paymentWebhookEvent.providerEventId, providerEventId));
    },
  };
}

function mapBooking(b: typeof s.booking.$inferSelect, commissionRate: string): BookingForPayment {
  return {
    id: b.id,
    code: b.code,
    organizationId: b.organizationId,
    clientAccountId: b.clientAccountId,
    totalAmount: { amount: b.totalAmount, currency: b.currency as 'COP' | 'USD' },
    status: b.status,
    commissionRate: Number(commissionRate),
  };
}

export function makePaymentBookingRepository(db: DbClient): PaymentBookingRepository {
  async function findBy(where: SQL) {
    const rows = await db
      .select({ b: s.booking, commissionRate: s.organization.commissionRate })
      .from(s.booking)
      .innerJoin(s.organization, eq(s.organization.id, s.booking.organizationId))
      .where(where)
      .limit(1);
    const r = rows[0];
    return r ? mapBooking(r.b, r.commissionRate) : null;
  }
  return {
    findByCode: (code) => findBy(eq(s.booking.code, code)),
    findById: (id) => findBy(eq(s.booking.id, id)),
    async setStatus(id, status, at) {
      await db
        .update(s.booking)
        .set({
          status: status as typeof s.booking.$inferInsert.status,
          ...(status === 'confirmed' ? { confirmedAt: at } : {}),
          updatedAt: at,
        })
        .where(eq(s.booking.id, id));
    },
  };
}
