import { z } from 'zod';
import { ConsentPurpose, VerificationLevel } from './enums.js';

/** Registro (vista A02). El consentimiento de términos y privacidad es obligatorio. */
export const RegisterSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  full_name: z.string().min(3, 'Escribe tu nombre completo').max(160),
  phone: z.string().max(20).optional(),
  // Ley 1581: aceptación explícita, no preseleccionada.
  accept_terms: z.literal(true, {
    errorMap: () => ({ message: 'Debes aceptar los términos para registrarte' }),
  }),
  accept_privacy: z.literal(true, {
    errorMap: () => ({ message: 'Debes autorizar el tratamiento de datos para registrarte' }),
  }),
  accept_marketing: z.boolean().default(false),
});
export type Register = z.infer<typeof RegisterSchema>;

/** Inicio de sesión (vista A01). */
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Escribe tu contraseña'),
});
export type Login = z.infer<typeof LoginSchema>;

/** Perfil de la cuenta autenticada (GET /v1/me). */
export const MeSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  display_name: z.string().nullable(),
  phone: z.string().nullable(),
  email_verified: z.boolean(),
  phone_verified: z.boolean(),
  document_verified: z.boolean(),
  verification_level: VerificationLevel,
  verification_next: VerificationLevel.nullable(),
  verification_missing: z.string().nullable(),
  city: z.string().nullable(),
  department: z.string().nullable(),
});
export type Me = z.infer<typeof MeSchema>;

/** Actualización de perfil (PATCH /v1/me). */
export const UpdateMeSchema = z.object({
  full_name: z.string().min(3).max(160).optional(),
  display_name: z.string().max(80).nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  city: z.string().max(80).nullable().optional(),
  department: z.string().max(80).nullable().optional(),
});
export type UpdateMe = z.infer<typeof UpdateMeSchema>;

/** Otorgar o revocar un consentimiento (POST /v1/me/consents). */
export const GrantConsentSchema = z.object({
  purpose: ConsentPurpose,
  granted: z.boolean(),
});
export type GrantConsent = z.infer<typeof GrantConsentSchema>;

export const ConsentRecordSchema = z.object({
  purpose: ConsentPurpose,
  granted: z.boolean(),
  granted_at: z.string().datetime().nullable(),
  revoked_at: z.string().datetime().nullable(),
  policy_version: z.string(),
});
export type ConsentRecord = z.infer<typeof ConsentRecordSchema>;

/** Solicitud de derechos del titular (POST /v1/me/data-requests). */
export const DataRequestSchema = z.object({
  kind: z.enum(['export', 'delete', 'rectify']),
  notes: z.string().max(1000).optional(),
});
export type DataRequest = z.infer<typeof DataRequestSchema>;
