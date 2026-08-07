import type { Account, Organization } from './entities.js';

/**
 * Niveles de verificación (§4.1) como función PURA del dominio.
 * Dado el estado de una cuenta/organización, devuelve el nivel alcanzado y qué
 * falta para el siguiente. No como condicionales dispersos por la interfaz.
 */

export type VerificationLevel =
  | 'l0_email'
  | 'l1_phone'
  | 'l2_document'
  | 'l3_tax_id'
  | 'l4_tourism'
  | 'l5_insurance';

const ORDER: VerificationLevel[] = [
  'l0_email',
  'l1_phone',
  'l2_document',
  'l3_tax_id',
  'l4_tourism',
  'l5_insurance',
];

export interface VerificationState {
  level: VerificationLevel;
  next: VerificationLevel | null;
  missingForNext: string | null;
}

export interface VerificationInputs {
  account: Pick<Account, 'emailVerifiedAt' | 'phoneVerifiedAt' | 'documentVerifiedAt'>;
  organization?: Pick<Organization, 'taxIdVerifiedAt' | 'tourismRegistryValidUntil'> & {
    hasValidInsurance?: boolean;
  };
  now?: Date;
}

export function computeVerificationLevel(inputs: VerificationInputs): VerificationState {
  const { account, organization } = inputs;
  const now = inputs.now ?? new Date();

  let level: VerificationLevel = 'l0_email';
  const reached: Partial<Record<VerificationLevel, boolean>> = {
    l0_email: !!account.emailVerifiedAt,
    l1_phone: !!account.phoneVerifiedAt,
    l2_document: !!account.documentVerifiedAt,
    l3_tax_id: !!organization?.taxIdVerifiedAt,
    l4_tourism:
      !!organization?.tourismRegistryValidUntil &&
      organization.tourismRegistryValidUntil.getTime() > now.getTime(),
    l5_insurance: !!organization?.hasValidInsurance,
  };

  // El nivel es el prefijo continuo más alto que se cumple.
  for (const l of ORDER) {
    if (reached[l]) level = l;
    else break;
  }

  const idx = ORDER.indexOf(level);
  const next = idx < ORDER.length - 1 ? ORDER[idx + 1]! : null;

  const missing: Record<VerificationLevel, string> = {
    l0_email: 'Verifica tu correo',
    l1_phone: 'Verifica tu teléfono por SMS',
    l2_document: 'Verifica tu documento de identidad',
    l3_tax_id: 'Verifica el NIT de la organización',
    l4_tourism: 'Carga un RNT vigente',
    l5_insurance: 'Carga una póliza de responsabilidad civil vigente',
  };

  return {
    level,
    next,
    missingForNext: next ? missing[next] : null,
  };
}
