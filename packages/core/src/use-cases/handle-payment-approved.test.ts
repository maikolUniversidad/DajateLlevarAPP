import { describe, expect, it } from 'vitest';
import type { LedgerEntryDraft } from '../payment-math.js';
import type {
  BookingForPayment,
  Clock,
  DomainEventInput,
  EventPublisher,
  LedgerRepository,
  PaymentBookingRepository,
  PaymentRecord,
  PaymentRepository,
  ProviderTransaction,
} from '../ports.js';
import { handlePaymentTransaction } from './handle-payment-approved.js';

const NOW = new Date('2026-08-07T12:00:00-05:00');
const clock: Clock = { now: () => NOW };

function makeDeps(over?: {
  payment?: Partial<PaymentRecord> | null;
  booking?: Partial<BookingForPayment> | null;
  ledgerHas?: boolean;
}) {
  const payment: PaymentRecord | null =
    over?.payment === null
      ? null
      : {
          id: 'pay-1',
          bookingId: 'bk-1',
          organizationId: 'org-1',
          payerAccountId: 'acc-1',
          status: 'created',
          method: null,
          amount: { amount: 8500000, currency: 'COP' },
          provider: 'wompi',
          providerTransactionId: null,
          reference: 'REF-1',
          ...over?.payment,
        };
  const booking: BookingForPayment | null =
    over?.booking === null
      ? null
      : {
          id: 'bk-1',
          code: 'DL-1000',
          organizationId: 'org-1',
          clientAccountId: 'acc-1',
          totalAmount: { amount: 8500000, currency: 'COP' },
          status: 'pending_payment',
          commissionRate: 0.12,
          ...over?.booking,
        };

  const marks: unknown[] = [];
  const ledgerTx: { id: string; entries: LedgerEntryDraft[] }[] = [];
  const events: DomainEventInput[] = [];
  let ledgerHas = over?.ledgerHas ?? false;
  let bookingStatus = booking?.status;

  const payments: PaymentRepository = {
    create: async () => payment!,
    findById: async () => payment,
    findByReference: async (ref) => (payment && payment.reference === ref ? payment : null),
    markStatus: async (m) => {
      marks.push(m);
    },
  };
  const bookings: PaymentBookingRepository = {
    findByCode: async () => booking,
    findById: async () => booking,
    setStatus: async (_id, status) => {
      bookingStatus = status;
    },
  };
  const ledger: LedgerRepository = {
    hasTransaction: async () => ledgerHas,
    recordTransaction: async (id, entries) => {
      ledgerTx.push({ id, entries });
      ledgerHas = true;
    },
  };
  const eventPub: EventPublisher = { publish: async (e) => void events.push(e) };

  return {
    deps: { payments, bookings, ledger, events: eventPub, clock },
    marks,
    ledgerTx,
    events,
    getBookingStatus: () => bookingStatus,
  };
}

function tx(over?: Partial<ProviderTransaction>): ProviderTransaction {
  return {
    id: 'wompi-tx-1',
    reference: 'REF-1',
    status: 'approved',
    amount: { amount: 8500000, currency: 'COP' },
    method: 'CARD',
    ...over,
  };
}

describe('handlePaymentTransaction', () => {
  it('aprueba: asienta el ledger cuadrado y confirma la reserva', async () => {
    const h = makeDeps();
    const res = await handlePaymentTransaction(h.deps, tx());
    expect(res.ok && res.value).toBe('settled');
    expect(h.ledgerTx).toHaveLength(1);
    const entries = h.ledgerTx[0]!.entries;
    const debit = entries.filter((e) => e.side === 'debit').reduce((s, e) => s + e.amount, 0);
    const credit = entries.filter((e) => e.side === 'credit').reduce((s, e) => s + e.amount, 0);
    expect(debit).toBe(credit); // cuadra
    expect(h.getBookingStatus()).toBe('confirmed');
    expect(h.events.some((e) => e.eventType === 'booking.confirmed')).toBe(true);
  });

  it('es idempotente: si el ledger ya existe, no reprocesa', async () => {
    const h = makeDeps({ ledgerHas: true });
    const res = await handlePaymentTransaction(h.deps, tx());
    expect(res.ok && res.value).toBe('already_settled');
    expect(h.ledgerTx).toHaveLength(0);
  });

  it('rechaza montos que no coinciden', async () => {
    const h = makeDeps();
    const res = await handlePaymentTransaction(
      h.deps,
      tx({ amount: { amount: 999, currency: 'COP' } }),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('PRICING_INVALID');
    expect(h.ledgerTx).toHaveLength(0);
  });

  it('declinado: marca el pago fallido, sin ledger', async () => {
    const h = makeDeps();
    const res = await handlePaymentTransaction(h.deps, tx({ status: 'declined' }));
    expect(res.ok && res.value).toBe('failed');
    expect(h.ledgerTx).toHaveLength(0);
    expect(h.events.some((e) => e.eventType === 'payment.failed')).toBe(true);
  });

  it('referencia desconocida: se ignora sin error', async () => {
    const h = makeDeps({ payment: null });
    const res = await handlePaymentTransaction(h.deps, tx({ reference: 'OTRA' }));
    expect(res.ok && res.value).toBe('ignored');
  });
});
