import { z } from 'zod';

/**
 * DINERO — regla innegociable #1.
 * Enteros en centavos, nunca float, nunca decimales en el transporte.
 * $ 85.000 COP se representa como { amount: 8500000, currency: 'COP' }.
 */

export const CurrencySchema = z.enum(['COP', 'USD']);
export type Currency = z.infer<typeof CurrencySchema>;

export const MoneySchema = z.object({
  /** Monto en centavos. Entero. Puede ser 0 pero nunca negativo en transporte. */
  amount: z.number().int().nonnegative(),
  currency: CurrencySchema.default('COP'),
});
export type Money = z.infer<typeof MoneySchema>;

export function money(amount: number, currency: Currency = 'COP'): Money {
  return MoneySchema.parse({ amount, currency });
}

/** Suma montos de la misma moneda. Lanza si mezclan monedas. */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`No se pueden sumar monedas distintas: ${a.currency} y ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

/** Formatea para presentación en español de Colombia: "$ 85.000 COP". */
export function formatMoney(m: Money): string {
  const pesos = m.amount / 100;
  const formatted = new Intl.NumberFormat('es-CO', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(pesos);
  return `$ ${formatted} ${m.currency}`;
}
