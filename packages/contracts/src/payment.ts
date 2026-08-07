import { z } from 'zod';
import { LedgerAccount, LedgerSide, PaymentMethod, PaymentStatus } from './enums.js';
import { MoneySchema } from './money.js';

/**
 * PAGOS (§4.6, §10.4). Dinero SIEMPRE en centavos. El "saldo" nunca se guarda:
 * se calcula sumando asientos del ledger de doble entrada.
 */

/** Iniciar el pago de una reserva: POST /v1/payments. */
export const InitiatePaymentSchema = z.object({
  booking_code: z.string().min(1),
  method: PaymentMethod.optional(),
  /** A dónde vuelve el usuario tras el checkout de Wompi. */
  redirect_url: z.string().url().optional(),
});
export type InitiatePayment = z.infer<typeof InitiatePaymentSchema>;

/** Datos que el frontend necesita para abrir el checkout/widget de Wompi. */
export const CheckoutDataSchema = z.object({
  payment_id: z.string().uuid(),
  provider: z.string(),
  public_key: z.string(),
  reference: z.string(),
  amount_in_cents: z.number().int().positive(),
  currency: z.string().length(3),
  /** Firma de integridad SHA-256(reference+amount+currency+secret). */
  signature: z.string(),
  redirect_url: z.string().url().optional(),
});
export type CheckoutData = z.infer<typeof CheckoutDataSchema>;

/** Estado de un pago: GET /v1/payments/:id. */
export const PaymentViewSchema = z.object({
  id: z.string().uuid(),
  booking_code: z.string().nullable(),
  status: PaymentStatus,
  method: PaymentMethod.nullable(),
  amount: MoneySchema,
  provider: z.string(),
  provider_transaction_id: z.string().nullable(),
  created_at: z.string().datetime(),
});
export type PaymentView = z.infer<typeof PaymentViewSchema>;

/** Un asiento del ledger tal como lo devuelve GET /v1/ledger. */
export const LedgerEntryViewSchema = z.object({
  transaction_id: z.string().uuid(),
  account_type: LedgerAccount,
  side: LedgerSide,
  amount: MoneySchema,
  description: z.string(),
  booking_id: z.string().uuid().nullable(),
  occurred_at: z.string().datetime(),
});
export type LedgerEntryView = z.infer<typeof LedgerEntryViewSchema>;

/** Desglose económico de una reserva (comisión, IVA, neto al prestador). */
export const BookingSplitSchema = z.object({
  total: MoneySchema,
  commission: MoneySchema,
  vat: MoneySchema,
  platform_revenue_net: MoneySchema,
  provider_payable: MoneySchema,
});
export type BookingSplit = z.infer<typeof BookingSplitSchema>;
