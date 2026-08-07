import { z } from 'zod';
import { ConsentPurpose, MembershipRole, ProfileType, VerificationLevel } from './enums.js';

/**
 * NOTA: el registro de Creador vive en su flujo dedicado (RegisterCreatorSchema en
 * ./creator.ts: enlaces sociales + análisis con IA, Ley 1581). En el registro
 * unificado, elegir "creador" crea la cuenta base y deriva a ese onboarding.
 *
 * Datos mínimos para activar el perfil de Empresa (§10.1). Queda PENDIENTE de
 * verificación de NIT (cámara de comercio) y RNT; no sube el nivel de verificación.
 */
/** Una sede (local) de la empresa. Se pueden agregar en el alta o más adelante. */
export const RegisterBusinessLocationSchema = z.object({
  name: z.string().min(1, 'Escribe el nombre de la sede').max(160),
  address: z.string().max(200).optional(),
  city: z.string().min(2, 'Escribe la ciudad de la sede').max(80),
  department: z.string().min(2, 'Escribe el departamento de la sede').max(80),
  // Opcionales: si el cliente geolocaliza la sede en el futuro.
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type RegisterBusinessLocation = z.infer<typeof RegisterBusinessLocationSchema>;

export const RegisterBusinessSchema = z.object({
  legal_name: z.string().min(3, 'Escribe la razón social').max(200),
  trade_name: z.string().min(2, 'Escribe el nombre comercial').max(160),
  tax_id: z.string().min(5, 'Escribe el NIT').max(40),
  tourism_registry: z.string().max(40).optional(),
  email: z.string().email('Correo de la empresa inválido').optional(),
  phone: z.string().min(7, 'Escribe un teléfono válido').max(20),
  city: z.string().min(2, 'Escribe la ciudad').max(80),
  department: z.string().min(2, 'Escribe el departamento').max(80),
  // Gremio / sector PRINCIPAL (derivado: el primero elegido). Se conserva por
  // compatibilidad con la activación que ya lo persiste como sector único.
  sector: z.string().max(80).optional(),
  // Gremios / sectores del negocio: se pueden elegir VARIOS (p. ej. restaurante + bar).
  sectors: z.array(z.string().max(80)).max(20).default([]),
  // Gremio PERSONALIZADO escrito por el usuario si no está en la lista.
  custom_sector: z.string().max(80).optional(),
  // Sedes (locales) opcionales; el registro las crea junto con la organización.
  sedes: z.array(RegisterBusinessLocationSchema).max(50).optional(),
});
export type RegisterBusiness = z.infer<typeof RegisterBusinessSchema>;

/**
 * Datos de Creador enviados INLINE en el registro unificado. El backend los
 * procesa con el onboarding de creador (activar perfil + conectar redes para el
 * análisis con IA, Ley 1581). El esquema rico vive en ./creator.ts.
 */
/**
 * Segmentación descriptiva de la audiencia del creador (§12). Alimenta el
 * matching con marcas. NO son métricas duras (seguidores, engagement, fidelidad):
 * esas se CALCULAN del análisis de contenido, nunca se declaran.
 */
export const CreatorAudienceInlineSchema = z.object({
  age_ranges: z.array(z.string().max(20)).max(10).default([]),
  gender: z.enum(['mostly_women', 'mostly_men', 'balanced']).optional(),
  interests: z.array(z.string().max(60)).max(30).default([]),
  scope: z.enum(['national', 'regional', 'local']).optional(),
});
export type CreatorAudienceInline = z.infer<typeof CreatorAudienceInlineSchema>;

export const RegisterCreatorInlineSchema = z.object({
  handle: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').max(60),
  bio: z.string().max(500).optional(),
  categories: z.array(z.string()).default([]),
  cities: z.array(z.string()).default([]),
  social_links: z
    .array(z.object({ url: z.string().url('URL inválida'), network: z.string() }))
    .min(1, 'Agrega al menos un enlace de red social'),
  // Estilo y audiencia (para el matching con marcas). Descriptivo, no métrico.
  creator_type: z.string().max(60).optional(),
  formats: z.array(z.string().max(60)).max(20).default([]),
  audience: CreatorAudienceInlineSchema.optional(),
});
export type RegisterCreatorInline = z.infer<typeof RegisterCreatorInlineSchema>;

/**
 * Registro (vista A02). El consentimiento de términos y privacidad es obligatorio.
 * `profile_type` decide qué perfil se activa además del de Cliente (siempre activo).
 */
export const RegisterSchema = z
  .object({
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
    // Perfil a activar en el alta. Cliente queda siempre activo (§10.1). Empresa y
    // Creador traen sus datos inline y se activan en el mismo registro.
    profile_type: ProfileType.default('client'),
    business: RegisterBusinessSchema.optional(),
    creator: RegisterCreatorInlineSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.profile_type === 'business' && !data.business) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['business'],
        message: 'Faltan los datos del perfil de empresa',
      });
    }
    if (data.profile_type === 'creator' && !data.creator) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['creator'],
        message: 'Faltan los datos del perfil de creador',
      });
    }
    if (data.profile_type === 'agency') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['profile_type'],
        message: 'El perfil de agencia aún no está disponible',
      });
    }
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

/** Perfiles activos de la cuenta (se incluye en GET /v1/me). Cliente siempre activo. */
export const AccountProfilesSchema = z.object({
  client: z.literal(true),
  creator: z.boolean(),
  organizations: z.array(
    z.object({
      id: z.string().uuid(),
      trade_name: z.string(),
      role: MembershipRole,
    }),
  ),
});
export type AccountProfiles = z.infer<typeof AccountProfilesSchema>;

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
