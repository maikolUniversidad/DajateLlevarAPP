import { z } from 'zod';

/**
 * Uniones de literales que reflejan 1:1 las enumeraciones de Postgres (§3.1).
 * Fuente de verdad de tipos compartida entre dominio, API y UI.
 */

export const ProfileType = z.enum(['client', 'creator', 'business', 'agency']);
export const VerificationLevel = z.enum([
  'l0_email',
  'l1_phone',
  'l2_document',
  'l3_tax_id',
  'l4_tourism',
  'l5_insurance',
]);
export const MembershipRole = z.enum(['owner', 'admin', 'staff', 'viewer']);

export const ServiceModality = z.enum(['scheduled', 'capacity', 'on_demand', 'digital']);
export const ServiceStatus = z.enum(['draft', 'pending_review', 'published', 'paused', 'archived']);
export const PricingMode = z.enum(['fixed', 'from', 'quote_only']);
export const LocationMode = z.enum(['on_site', 'at_client', 'remote', 'hybrid']);
export const RiskCategory = z.enum(['none', 'moderate', 'high']);

export const BookingStatus = z.enum([
  'draft',
  'pending_payment',
  'pending_confirmation',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled_by_client',
  'cancelled_by_provider',
  'no_show',
  'expired',
]);
export const QuoteStatus = z.enum([
  'requested',
  'answered',
  'negotiating',
  'accepted',
  'rejected',
  'expired',
]);
export const CancellationPolicy = z.enum(['flexible', 'moderate', 'strict', 'non_refundable']);

export const PaymentStatus = z.enum([
  'created',
  'authorized',
  'held',
  'released',
  'refunded',
  'partially_refunded',
  'failed',
  'reversed',
]);
export const PaymentMethod = z.enum([
  'card',
  'pse',
  'nequi',
  'daviplata',
  'bancolombia',
  'bre_b',
  'cash',
  'wallet_credit',
]);
export const LedgerSide = z.enum(['debit', 'credit']);
export const LedgerAccount = z.enum([
  'client_funds',
  'platform_revenue',
  'provider_payable',
  'creator_payable',
  'tax_withholding',
  'vat_payable',
  'escrow_held',
  'refund_issued',
  'gateway_fee',
]);
export const PayoutStatus = z.enum(['requested', 'processing', 'completed', 'failed', 'cancelled']);

export const ReviewStatus = z.enum(['published', 'flagged', 'hidden', 'removed']);
export const ReviewAxisKind = z.enum([
  'expectation_vs_reality',
  'service_quality',
  'punctuality',
  'accessibility',
  'value_for_money',
]);

export const CampaignStatus = z.enum([
  'draft',
  'open',
  'matching',
  'negotiating',
  'contracted',
  'in_production',
  'in_review',
  'published',
  'completed',
  'cancelled',
  'disputed',
]);
export const CampaignModel = z.enum(['affiliate', 'fixed_fee', 'hybrid']);
export const ApplicationStatus = z.enum([
  'submitted',
  'shortlisted',
  'rejected',
  'accepted',
  'withdrawn',
]);
export const DeliverableStatus = z.enum([
  'pending',
  'submitted',
  'changes_requested',
  'approved',
  'auto_approved',
  'rejected',
]);
export const SocialNetwork = z.enum(['tiktok', 'instagram', 'youtube', 'facebook', 'x', 'twitch']);

export const AttributionMechanism = z.enum([
  'tracked_link',
  'creator_code',
  'deep_link',
  'post_survey',
  'view_through',
]);
export const AttributionModel = z.enum([
  'last_non_direct',
  'first_touch',
  'linear',
  'position_based',
]);

export const DisputeStatus = z.enum([
  'open',
  'evidence_requested',
  'under_review',
  'resolved_client',
  'resolved_provider',
  'resolved_split',
  'withdrawn',
]);
export const FraudSignalKind = z.enum([
  'fake_review',
  'duplicate_account',
  'collusion',
  'audience_inflation',
  'payment_laundering',
  'attribution_fraud',
]);

export const ConnectorKind = z.enum([
  'calendar',
  'crm',
  'accounting',
  'social',
  'payment',
  'messaging',
  'ota_channel',
  'storage',
  'mcp_server',
]);
export const SyncDirection = z.enum(['inbound', 'outbound', 'bidirectional']);
export const SyncStatus = z.enum(['ok', 'degraded', 'failed', 'revoked']);

export const ConsentPurpose = z.enum([
  'terms',
  'privacy',
  'marketing',
  'sensitive_accessibility',
  'ai_processing',
  'data_sharing',
]);

export type ServiceModality = z.infer<typeof ServiceModality>;
export type ServiceStatus = z.infer<typeof ServiceStatus>;
export type BookingStatus = z.infer<typeof BookingStatus>;
export type RiskCategory = z.infer<typeof RiskCategory>;
export type PricingMode = z.infer<typeof PricingMode>;
export type CancellationPolicy = z.infer<typeof CancellationPolicy>;
export type ReviewAxisKind = z.infer<typeof ReviewAxisKind>;
export type LedgerSide = z.infer<typeof LedgerSide>;
export type LedgerAccount = z.infer<typeof LedgerAccount>;
