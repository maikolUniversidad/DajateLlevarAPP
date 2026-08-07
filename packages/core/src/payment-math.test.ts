import { describe, expect, it } from 'vitest';
import { assertBalanced, buildSettlementLedger, computeBookingSplit } from './payment-math.js';

const refs = {
  transactionId: 'tx-1',
  organizationId: 'org-1',
  bookingId: 'bk-1',
  paymentId: 'pay-1',
  currency: 'COP' as const,
};

describe('computeBookingSplit', () => {
  it('reparte el total en comisión, IVA y neto al prestador sin perder centavos', () => {
    const s = computeBookingSplit(10000000, 0.12); // $100.000
    expect(s.commission).toBe(1200000); // 12%
    expect(s.vat).toBe(228000); // 19% de la comisión
    expect(s.platformRevenueNet).toBe(972000);
    expect(s.providerPayable).toBe(8800000);
    // Invariante: nada se pierde
    expect(s.providerPayable + s.platformRevenueNet + s.vat).toBe(s.total);
  });

  it('cuadra para montos con redondeo', () => {
    for (const total of [1, 99, 8500000, 12345678, 7]) {
      const s = computeBookingSplit(total, 0.15);
      expect(s.providerPayable + s.platformRevenueNet + s.vat).toBe(total);
    }
  });

  it('rechaza totales no enteros o negativos', () => {
    expect(() => computeBookingSplit(-1, 0.12)).toThrow();
    expect(() => computeBookingSplit(1.5, 0.12)).toThrow();
  });
});

describe('buildSettlementLedger', () => {
  it('produce una transacción de doble entrada que cuadra', () => {
    const split = computeBookingSplit(8500000, 0.12);
    const entries = buildSettlementLedger(split, refs);
    const debit = entries.filter((e) => e.side === 'debit').reduce((s, e) => s + e.amount, 0);
    const credit = entries.filter((e) => e.side === 'credit').reduce((s, e) => s + e.amount, 0);
    expect(debit).toBe(credit);
    expect(debit).toBe(8500000);
    // El escrow se debita por el total; hay 3 créditos (prestador, plataforma, IVA)
    expect(entries.filter((e) => e.side === 'credit')).toHaveLength(3);
  });
});

describe('assertBalanced', () => {
  it('lanza si la transacción no cuadra', () => {
    expect(() =>
      assertBalanced([
        { accountType: 'escrow_held', side: 'debit', amount: 100, description: 'x' },
        { accountType: 'provider_payable', side: 'credit', amount: 90, description: 'y' },
      ]),
    ).toThrow(/descuadrada/);
  });
});
