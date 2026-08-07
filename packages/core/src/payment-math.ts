import type { LedgerAccount, LedgerSide, Money } from '@dejatellevar/contracts';

/**
 * Matemática de pagos y ledger de doble entrada (§4.6, §5.5).
 * Todo en centavos, enteros. El IVA colombiano (19%) aplica sobre la COMISIÓN de
 * la plataforma, no sobre el total del servicio (la plataforma solo intermedia).
 */

export const VAT_RATE = 0.19; // IVA Colombia

export interface BookingSplit {
  total: number; // lo que paga el cliente (centavos)
  commission: number; // comisión de la plataforma
  vat: number; // IVA sobre la comisión
  platformRevenueNet: number; // comisión neta de IVA (ingreso de la plataforma)
  providerPayable: number; // neto a pagar al prestador
}

/**
 * Reparte el total de una reserva entre prestador, plataforma e IVA.
 * Invariante: providerPayable + platformRevenueNet + vat === total (sin centavos perdidos).
 */
export function computeBookingSplit(total: number, commissionRate: number): BookingSplit {
  if (!Number.isInteger(total) || total < 0) {
    throw new Error('El total debe ser un entero de centavos no negativo');
  }
  const commission = Math.round(total * commissionRate);
  const vat = Math.round(commission * VAT_RATE);
  const platformRevenueNet = commission - vat;
  const providerPayable = total - commission;
  return { total, commission, vat, platformRevenueNet, providerPayable };
}

export interface LedgerEntryDraft {
  accountType: LedgerAccount;
  side: LedgerSide;
  amount: number;
  organizationId?: string | null;
  accountId?: string | null;
  bookingId?: string | null;
  paymentId?: string | null;
  taxKind?: string | null;
  taxRate?: number | null;
  description: string;
}

export interface SettlementRefs {
  transactionId: string;
  organizationId: string;
  bookingId: string;
  paymentId: string;
  currency: Money['currency'];
}

/**
 * Construye la transacción de LIQUIDACIÓN de un pago aprobado: el total sale del
 * escrow y se reparte en pagadero al prestador, ingreso de plataforma e IVA.
 * SIEMPRE cuadra: suma(débitos) === suma(créditos). Es la defensa contable del §6.
 */
export function buildSettlementLedger(
  split: BookingSplit,
  refs: SettlementRefs,
): LedgerEntryDraft[] {
  const base = {
    organizationId: refs.organizationId,
    bookingId: refs.bookingId,
    paymentId: refs.paymentId,
  };
  const entries: LedgerEntryDraft[] = [
    {
      ...base,
      accountType: 'escrow_held',
      side: 'debit',
      amount: split.total,
      description: 'Liberación de escrow de la reserva',
    },
    {
      ...base,
      accountType: 'provider_payable',
      side: 'credit',
      amount: split.providerPayable,
      description: 'Pago al prestador',
    },
    {
      ...base,
      accountType: 'platform_revenue',
      side: 'credit',
      amount: split.platformRevenueNet,
      taxKind: 'commission',
      description: 'Comisión de la plataforma (neta de IVA)',
    },
    {
      ...base,
      accountType: 'vat_payable',
      side: 'credit',
      amount: split.vat,
      taxKind: 'vat',
      taxRate: VAT_RATE,
      description: 'IVA sobre la comisión',
    },
  ];
  assertBalanced(entries);
  return entries;
}

/** Verifica que una transacción del ledger cuadre; lanza si no. Blindaje del dominio. */
export function assertBalanced(entries: LedgerEntryDraft[]): void {
  let debit = 0;
  let credit = 0;
  for (const e of entries) {
    if (!Number.isInteger(e.amount) || e.amount < 0) {
      throw new Error('Todo asiento del ledger debe ser un entero de centavos no negativo');
    }
    if (e.side === 'debit') debit += e.amount;
    else credit += e.amount;
  }
  if (debit !== credit) {
    throw new Error(`Transacción del ledger descuadrada: débitos=${debit} créditos=${credit}`);
  }
}
