import { type DomainError, domainError } from '../errors.js';
import { buildSettlementLedger, computeBookingSplit } from '../payment-math.js';
import type {
  Clock,
  EventPublisher,
  LedgerRepository,
  PaymentBookingRepository,
  PaymentRepository,
  ProviderTransaction,
} from '../ports.js';
import { type Result, err, ok } from '../result.js';

export interface HandlePaymentTransactionDeps {
  payments: PaymentRepository;
  bookings: PaymentBookingRepository;
  ledger: LedgerRepository;
  events: EventPublisher;
  clock: Clock;
}

export type PaymentOutcome = 'settled' | 'already_settled' | 'failed' | 'ignored' | 'pending';

/**
 * HandlePaymentTransaction — procesa el resultado de una transacción del PSP
 * (recibido por webhook, ya verificado e idempotente a nivel de evento).
 *
 * Al aprobarse:
 *  - Verifica que el monto coincide con el de la reserva.
 *  - Asienta la LIQUIDACIÓN de doble entrada (cuadra siempre): el total sale del
 *    escrow y se reparte en pagadero al prestador, ingreso de plataforma e IVA.
 *  - El transaction_id del ledger es el id del pago → idempotencia natural: si ya
 *    se asentó, no se duplica.
 *  - Confirma la reserva.
 */
export async function handlePaymentTransaction(
  deps: HandlePaymentTransactionDeps,
  transaction: ProviderTransaction,
): Promise<Result<PaymentOutcome, DomainError>> {
  const { payments, bookings, ledger, events, clock } = deps;
  const now = clock.now();

  const payment = await payments.findByReference(transaction.reference);
  if (!payment) {
    // Referencia desconocida (evento ajeno o de prueba): se ignora sin error.
    return ok('ignored');
  }

  if (transaction.status === 'pending') {
    return ok('pending');
  }

  if (transaction.status === 'declined' || transaction.status === 'error') {
    await payments.markStatus({
      id: payment.id,
      status: 'failed',
      providerTransactionId: transaction.id,
    });
    await events.publish({
      eventType: 'payment.failed',
      aggregateType: 'payment',
      aggregateId: payment.id,
      organizationId: payment.organizationId,
      payload: { reference: transaction.reference, status: transaction.status },
    });
    return ok('failed');
  }

  if (transaction.status === 'voided') {
    await payments.markStatus({
      id: payment.id,
      status: 'reversed',
      providerTransactionId: transaction.id,
    });
    return ok('failed');
  }

  // status === 'approved'
  if (transaction.amount.amount !== payment.amount.amount) {
    await payments.markStatus({
      id: payment.id,
      status: 'failed',
      providerTransactionId: transaction.id,
    });
    return err(
      domainError('PRICING_INVALID', 'El monto pagado no coincide con el de la reserva', {
        expected: payment.amount.amount,
        got: transaction.amount.amount,
      }),
    );
  }

  // Idempotencia: si el ledger de este pago ya existe, no reprocesar.
  if (await ledger.hasTransaction(payment.id)) {
    return ok('already_settled');
  }

  const booking = payment.bookingId ? await bookings.findById(payment.bookingId) : null;
  if (!booking) {
    return err(domainError('SERVICE_NOT_FOUND', 'La reserva del pago no existe'));
  }

  await payments.markStatus({
    id: payment.id,
    status: 'held',
    providerTransactionId: transaction.id,
    method: transaction.method,
    heldAt: now,
  });

  const split = computeBookingSplit(booking.totalAmount.amount, booking.commissionRate);
  const entries = buildSettlementLedger(split, {
    transactionId: payment.id,
    organizationId: booking.organizationId,
    bookingId: booking.id,
    paymentId: payment.id,
    currency: booking.totalAmount.currency,
  });
  await ledger.recordTransaction(payment.id, entries);

  await bookings.setStatus(booking.id, 'confirmed', now);

  await events.publish({
    eventType: 'booking.confirmed',
    aggregateType: 'booking',
    aggregateId: booking.id,
    organizationId: booking.organizationId,
    actorAccountId: booking.clientAccountId,
    payload: {
      code: booking.code,
      paymentId: payment.id,
      total: split.total,
      commission: split.commission,
      vat: split.vat,
      providerPayable: split.providerPayable,
    },
  });

  return ok('settled');
}
