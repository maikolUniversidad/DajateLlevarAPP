import { z } from 'zod';
import { ApplicationStatus, CampaignModel, CampaignStatus } from './enums.js';
import { MoneySchema } from './money.js';

/** Licencia de uso del contenido producido por el creador. */
export const ContentLicense = z.enum(['organic_only', 'paid_ads', 'full_buyout']);
export type ContentLicense = z.infer<typeof ContentLicense>;

/** Campaña / solicitud de contratación de creadores expuesta por la API (§12). */
export const CampaignSchema = z.object({
  id: z.string().uuid(),
  organization_id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  status: CampaignStatus,
  model: CampaignModel,
  // Brief
  objective: z.string(),
  target_audience: z.string().nullable(),
  key_messages: z.string().nullable(),
  do_not_mention: z.string().nullable(),
  reference_urls: z.array(z.string()),
  // Alcance
  service_ids: z.array(z.string().uuid()),
  target_cities: z.array(z.string()),
  target_categories: z.array(z.string()),
  // Economía (dinero en centavos → Money)
  budget_total: MoneySchema.nullable(),
  fee_per_creator: MoneySchema.nullable(),
  commission_rate: z.number().nullable(),
  // Licencia y plazos
  content_license: ContentLicense,
  exclusivity_days: z.number().int(),
  applications_close_at: z.string().datetime().nullable(),
  content_due_at: z.string().datetime().nullable(),
  // Resultados calculados
  total_reach: z.number().int(),
  attributed_bookings: z.number().int(),
  attributed_gmv: MoneySchema,
  roas: z.number().nullable(),
  created_at: z.string().datetime(),
});
export type Campaign = z.infer<typeof CampaignSchema>;

/** Cuerpo para crear una campaña (brief): POST /v1/campaigns. */
export const CreateCampaignSchema = z
  .object({
    organization_id: z.string().uuid(),
    name: z.string().min(3).max(160),
    model: CampaignModel.default('affiliate'),
    objective: z.string().min(10, 'Describe el objetivo de la campaña'),
    target_audience: z.string().optional(),
    key_messages: z.string().optional(),
    do_not_mention: z.string().optional(),
    reference_urls: z.array(z.string().url()).default([]),
    service_ids: z.array(z.string().uuid()).default([]),
    target_cities: z.array(z.string()).default([]),
    target_categories: z.array(z.string()).default([]),
    budget_total: MoneySchema.optional(),
    fee_per_creator: MoneySchema.optional(),
    commission_rate: z.number().min(0).max(1).optional(),
    content_license: ContentLicense.default('organic_only'),
    license_duration_days: z.number().int().positive().optional(),
    exclusivity_days: z.number().int().nonnegative().default(0),
    applications_close_at: z.string().datetime().optional(),
    content_due_at: z.string().datetime().optional(),
  })
  .refine((c) => c.model === 'fixed_fee' || c.commission_rate != null, {
    message: 'Los modelos de afiliación e híbrido requieren commission_rate',
    path: ['commission_rate'],
  });
export type CreateCampaign = z.infer<typeof CreateCampaignSchema>;

/** Postulación o invitación de un creador a una campaña. */
export const CampaignApplicationSchema = z.object({
  id: z.string().uuid(),
  campaign_id: z.string().uuid(),
  creator_profile_id: z.string().uuid(),
  status: ApplicationStatus,
  is_invitation: z.boolean(),
  pitch: z.string().nullable(),
  proposed_fee: MoneySchema.nullable(),
  match_score: z.number().nullable(),
  responded_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
});
export type CampaignApplication = z.infer<typeof CampaignApplicationSchema>;

/**
 * Invitar a un creador (la empresa le pide una propuesta): POST
 * /v1/campaigns/:id/invite. Crea una campaign_application con is_invitation=true.
 */
export const InviteCreatorSchema = z.object({
  creator_profile_id: z.string().uuid(),
  pitch: z.string().max(1000).optional(),
  proposed_fee: MoneySchema.optional(),
});
export type InviteCreator = z.infer<typeof InviteCreatorSchema>;
