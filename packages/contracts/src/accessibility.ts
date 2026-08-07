import { z } from 'zod';

/**
 * ACCESIBILIDAD — cinco dimensiones, cada una con tres estados (§3.3).
 * Dato potencialmente sensible (Ley 1581): se declara con consentimiento
 * separado y las reseñas se agregan, nunca se individualizan.
 */

export const AccessibilityDimensionSchema = z.enum([
  'mobility', // Movilidad reducida
  'visual', // Apoyo visual
  'hearing', // Apoyo auditivo
  'neurodivergent', // Apto neurodivergencia
  'children', // Apto menores
]);
export type AccessibilityDimension = z.infer<typeof AccessibilityDimensionSchema>;

export const AccessibilityStateSchema = z.enum(['yes', 'partial', 'no']);
export type AccessibilityState = z.infer<typeof AccessibilityStateSchema>;

export const AccessibilityProfileSchema = z.object({
  mobility: AccessibilityStateSchema.optional(),
  visual: AccessibilityStateSchema.optional(),
  hearing: AccessibilityStateSchema.optional(),
  neurodivergent: AccessibilityStateSchema.optional(),
  children: AccessibilityStateSchema.optional(),
});
export type AccessibilityProfile = z.infer<typeof AccessibilityProfileSchema>;

export const ACCESSIBILITY_LABELS: Record<AccessibilityDimension, string> = {
  mobility: 'Movilidad reducida',
  visual: 'Apoyo visual',
  hearing: 'Apoyo auditivo',
  neurodivergent: 'Apto neurodivergencia',
  children: 'Apto menores',
};
