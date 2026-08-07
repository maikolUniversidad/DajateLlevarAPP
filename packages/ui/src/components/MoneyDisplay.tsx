import { type Money, formatMoney } from '@dejatellevar/contracts';
import { cn } from '../lib/cn.js';

export interface MoneyDisplayProps {
  /** Monto en centavos. Regla #1: nunca decimales. */
  value: Money;
  className?: string;
  /** Muestra "desde" antes del monto (pricing_mode = 'from'). */
  from?: boolean;
}

/**
 * Todo monto se renderiza en IBM Plex Mono con cifras tabulares para que los
 * pesos se alineen verticalmente en tablas de liquidación (§1.3).
 */
export function MoneyDisplay({ value, className, from }: MoneyDisplayProps) {
  return (
    <span className={cn('font-mono tabular-nums', className)}>
      {from && <span className="text-text-muted">desde </span>}
      {formatMoney(value)}
    </span>
  );
}
