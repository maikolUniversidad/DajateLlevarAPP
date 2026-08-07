import {
  FIDELITY_MAX,
  FIDELITY_MIN,
  type FidelityScore,
  fidelityLabel,
} from '@dejatellevar/contracts';
import { cn } from '../lib/cn.js';

export interface FidelityMeterProps {
  score: FidelityScore;
  /** 'full' (44px, con etiquetas) o 'compact' (8px). */
  variant?: 'full' | 'compact';
  className?: string;
}

/**
 * MEDIDOR DE FIDELIDAD — el elemento firma del producto (§1.5).
 *
 * Barra horizontal de −3 a +3 con el cero marcado. Gradiente tinto → humo → brote.
 * El indicador es una barra vertical sólida de 3px en --carbon (precisión, no juguete).
 * Con menos de 5 reseñas muestra estado vacío honesto: nunca inventa un número.
 *
 * Accesibilidad: role="meter" con aria-valuenow/min/max y aria-valuetext; el valor
 * numérico y la etiqueta textual están siempre visibles, no solo el color.
 */
export function FidelityMeter({ score, variant = 'full', className }: FidelityMeterProps) {
  const label = fidelityLabel(score);
  const hasData = score.value !== null && score.sampleSize >= 5;
  const value = score.value ?? 0;

  // Posición del indicador 0..100% mapeando [-3, 3].
  const pct = ((value - FIDELITY_MIN) / (FIDELITY_MAX - FIDELITY_MIN)) * 100;

  const gradient = 'linear-gradient(90deg, var(--tinto) 0%, var(--humo) 50%, var(--brote) 100%)';

  if (variant === 'compact') {
    return (
      <div
        className={cn('w-full', className)}
        role="meter"
        aria-valuemin={FIDELITY_MIN}
        aria-valuemax={FIDELITY_MAX}
        aria-valuenow={hasData ? value : undefined}
        aria-valuetext={hasData ? `${value.toFixed(1)} · ${label}` : label}
        aria-label="Índice de fidelidad"
      >
        <div
          className="relative h-2 w-full rounded-full"
          style={{ background: hasData ? gradient : 'var(--niebla)' }}
        >
          {hasData && (
            <span
              className="absolute top-1/2 h-3 w-[3px] -translate-x-1/2 -translate-y-1/2 bg-carbon"
              style={{ left: `${pct}%` }}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn('w-full', className)}
      role="meter"
      aria-valuemin={FIDELITY_MIN}
      aria-valuemax={FIDELITY_MAX}
      aria-valuenow={hasData ? value : undefined}
      aria-valuetext={hasData ? `${value.toFixed(1)} · ${label}` : label}
      aria-label="Índice de fidelidad promocional"
    >
      <div className="mb-1 flex justify-between font-body text-xs text-text-muted">
        <span>Prometió de más</span>
        <span>Cumplió exacto</span>
        <span>Prometió de menos</span>
      </div>

      <div
        className="relative h-11 w-full overflow-hidden rounded-md border border-border"
        style={{ background: hasData ? gradient : 'var(--niebla)' }}
      >
        {/* Marca del cero */}
        <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-carbon/30" />
        {hasData ? (
          <span
            className="absolute top-0 h-full w-[3px] -translate-x-1/2 bg-carbon"
            style={{ left: `${pct}%` }}
            aria-hidden="true"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-body text-sm text-text-muted">
            Aún sin datos suficientes
          </div>
        )}
      </div>

      <div className="mt-1 flex justify-between font-mono text-xs text-text-muted tabular-nums">
        <span>−3</span>
        <span>0</span>
        <span>+3</span>
      </div>

      {hasData && (
        <div className="mt-2 text-center">
          <span className="font-display text-2xl text-text tabular-nums">
            {value > 0 ? '+' : ''}
            {value.toFixed(1)}
          </span>
          <p className="font-body text-sm text-text-muted">{label}</p>
        </div>
      )}
    </div>
  );
}
