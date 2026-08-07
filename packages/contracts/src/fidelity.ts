import { z } from 'zod';

/**
 * FIDELIDAD — el elemento firma del producto.
 * Eje Expectativa vs Realidad: de −3 (prometió de más) a +3 (prometió de menos).
 * El 0 es "cumplió exacto". Con menos de 5 reseñas no hay dato: no se inventa.
 */

export const FIDELITY_MIN = -3;
export const FIDELITY_MAX = 3;
export const FIDELITY_MIN_SAMPLE = 5;

export const FidelityScoreSchema = z.object({
  /** Valor −3.00 a 3.00, o null si no hay muestra suficiente. */
  value: z.number().min(FIDELITY_MIN).max(FIDELITY_MAX).nullable(),
  sampleSize: z.number().int().nonnegative(),
});
export type FidelityScore = z.infer<typeof FidelityScoreSchema>;

export type FidelityBand = 'insufficient' | 'far_below' | 'below' | 'meets' | 'above';

/** Etiquetas en español de Colombia para cada tramo del medidor. */
export const FIDELITY_LABELS: Record<FidelityBand, string> = {
  insufficient: 'Aún sin datos suficientes',
  far_below: 'Muy por debajo de lo prometido',
  below: 'Algo por debajo',
  meets: 'Cumple lo que promete',
  above: 'Supera lo prometido',
};

export function fidelityBand(score: FidelityScore): FidelityBand {
  if (score.value === null || score.sampleSize < FIDELITY_MIN_SAMPLE) {
    return 'insufficient';
  }
  const v = score.value;
  if (v <= -1.5) return 'far_below';
  if (v < -0.25) return 'below';
  if (v <= 0.75) return 'meets';
  return 'above';
}

export function fidelityLabel(score: FidelityScore): string {
  return FIDELITY_LABELS[fidelityBand(score)];
}
