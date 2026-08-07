import { type DomainError, domainError } from '../errors.js';
import type { CheckoutData } from '../ports.js';
import type {
  Clock,
  EventPublisher,
  PaymentBookingRepository,
  PaymentProvider,
  PaymentRepository,
} from '../ports.js';
import { type Result, err, ok } from '../result.js';

export interface InitiateBookingPaymentInput {
  bookingCode: string;
  payerAccountId: string;
  method?: string | null;
  redirectUrl?: string;
}

export interface InitiateBookingPaymentDeps {
  bookings: PaymentBookingRepository;
  payments: PaymentRepository;
  provider: PaymentProvider;
  events: EventPublisher;
  clock: Clock;
}

export interface InitiateBookingPaymentResult {
  paymentId: string;
  checkout: CheckoutData;
}

/**
 * InitiateBookingPayment — crea el pago de una reserva y devuelve los datos de
 * checkout (con firma de integridad del PSP) para que el cliente pague.
 *
 * Invariantes:
 *  - La reserva existe y está en estado que admite pago (pending_payment).
 *  - Solo el cliente dueño de la reserva puede iniciar su pago.
 *  - La plataforma NO custodia el dinero: solo prepara el cobro en el PSP (§5.4).
 */
export async function initiateBookingPayment(
  deps: InitiateBookingPaymentDeps,
  input: InitiateBookingPaymentInput,
): Promise<Result<InitiateBookingPaymentResult, DomainError>> {
  const { bookings, payments, provider, events } = deps;

  const booking = await bookings.findByCode(input.bookingCode);
  if (!booking) {
    return err(domainError('SERVICE_NOT_FOUND', 'La reserva no existe'));
  }
  if (booking.clientAccountId !== input.payerAccountId) {
    return err(domainError('NOT_AUTHORIZED', 'No puedes pagar una reserva que no es tuya'));
  }
  if (booking.status !== 'pending_payment') {
    return err(
      domainError('INVALID_TRANSITION', `La reserva no admite pago en estado ${booking.status}`),
    );
  }

  const payment = await payments.create({
    bookingId: booking.id,
    organizationId: booking.organizationId,
    payerAccountId: input.payerAccountId,
    amount: booking.totalAmount,
    method: input.method ?? null,
    provider: 'wompi',
  });

  const checkout = provider.prepareCheckout({
    amount: booking.totalAmount,
    reference: payment.reference,
    redirectUrl: input.redirectUrl,
  });

  await events.publish({
    eventType: 'payment.initiated',
    aggregateType: 'payment',
    aggregateId: payment.id,
    organizationId: booking.organizationId,
    actorAccountId: input.payerAccountId,
    payload: {
      bookingCode: booking.code,
      amount: booking.totalAmount.amount,
      reference: payment.reference,
    },
  });

  return ok({ paymentId: payment.id, checkout });
}
