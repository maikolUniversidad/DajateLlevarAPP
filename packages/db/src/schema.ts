import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

/**
 * Schema de Drizzle: capa de CONSULTA tipada sobre el esquema real.
 * Las migraciones SQL en ./migrations son la fuente autoritativa; aquí solo
 * declaramos las tablas que el código consulta hoy. Los nombres y tipos deben
 * coincidir con la migración correspondiente.
 */

const ts = (name: string) => timestamp(name, { withTimezone: true });

// --- Enums (subconjunto usado por el código) --------------------------------
export const serviceModality = pgEnum('service_modality', [
  'scheduled',
  'capacity',
  'on_demand',
  'digital',
]);
export const serviceStatus = pgEnum('service_status', [
  'draft',
  'pending_review',
  'published',
  'paused',
  'archived',
]);
export const pricingMode = pgEnum('pricing_mode', ['fixed', 'from', 'quote_only']);
export const locationMode = pgEnum('location_mode', ['on_site', 'at_client', 'remote', 'hybrid']);
export const riskCategory = pgEnum('risk_category', ['none', 'moderate', 'high']);
export const cancellationPolicy = pgEnum('cancellation_policy', [
  'flexible',
  'moderate',
  'strict',
  'non_refundable',
]);
export const bookingStatus = pgEnum('booking_status', [
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
export const reviewStatus = pgEnum('review_status', ['published', 'flagged', 'hidden', 'removed']);
export const reviewAxisKind = pgEnum('review_axis_kind', [
  'expectation_vs_reality',
  'service_quality',
  'punctuality',
  'accessibility',
  'value_for_money',
  'cleanliness',
  'instagrammability',
]);
export const ledgerSide = pgEnum('ledger_side', ['debit', 'credit']);
export const ledgerAccount = pgEnum('ledger_account', [
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
export const paymentStatus = pgEnum('payment_status', [
  'created',
  'authorized',
  'held',
  'released',
  'refunded',
  'partially_refunded',
  'failed',
  'reversed',
]);

export const verificationLevel = pgEnum('verification_level', [
  'l0_email',
  'l1_phone',
  'l2_document',
  'l3_tax_id',
  'l4_tourism',
  'l5_insurance',
]);
export const consentPurpose = pgEnum('consent_purpose', [
  'terms',
  'privacy',
  'marketing',
  'sensitive_accessibility',
  'ai_processing',
  'data_sharing',
]);

// --- Identidad --------------------------------------------------------------
export const account = pgTable('account', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull(),
  emailVerifiedAt: ts('email_verified_at'),
  phone: varchar('phone', { length: 20 }),
  phoneVerifiedAt: ts('phone_verified_at'),
  fullName: varchar('full_name', { length: 160 }).notNull(),
  displayName: varchar('display_name', { length: 80 }),
  avatarUrl: text('avatar_url'),
  birthDate: date('birth_date'),
  documentType: varchar('document_type', { length: 20 }),
  documentNumber: varchar('document_number', { length: 40 }),
  documentVerifiedAt: ts('document_verified_at'),
  city: varchar('city', { length: 80 }),
  department: varchar('department', { length: 80 }),
  country: char('country', { length: 2 }).notNull().default('CO'),
  locale: varchar('locale', { length: 10 }).notNull().default('es-CO'),
  timezone: varchar('timezone', { length: 50 }).notNull().default('America/Bogota'),
  verificationLevel: verificationLevel('verification_level').notNull().default('l0_email'),
  externalAuthId: text('external_auth_id'),
  lastLoginAt: ts('last_login_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  deletedAt: ts('deleted_at'),
});

export const clientProfile = pgTable('client_profile', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid('account_id').notNull(),
  preferences: jsonb('preferences').notNull().default({}),
  accessibilityNeeds: jsonb('accessibility_needs'),
  totalBookings: integer('total_bookings').notNull().default(0),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

// --- Cumplimiento y consentimiento (Ley 1581) -------------------------------
export const policyVersion = pgTable('policy_version', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  purpose: consentPurpose('purpose').notNull(),
  version: varchar('version', { length: 20 }).notNull(),
  contentUrl: text('content_url').notNull(),
  contentHash: varchar('content_hash', { length: 64 }).notNull(),
  effectiveFrom: ts('effective_from').notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const consent = pgTable('consent', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid('account_id').notNull(),
  policyVersionId: uuid('policy_version_id').notNull(),
  purpose: consentPurpose('purpose').notNull(),
  granted: boolean('granted').notNull(),
  grantedAt: ts('granted_at').notNull().defaultNow(),
  revokedAt: ts('revoked_at'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

export const dataSubjectRequest = pgTable('data_subject_request', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  accountId: uuid('account_id').notNull(),
  kind: varchar('kind', { length: 30 }).notNull(),
  status: varchar('status', { length: 30 }).notNull().default('received'),
  requestedAt: ts('requested_at').notNull().defaultNow(),
  resolvedAt: ts('resolved_at'),
  resultUrl: text('result_url'),
  notes: text('notes'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const organization = pgTable('organization', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull(),
  legalName: varchar('legal_name', { length: 200 }).notNull(),
  tradeName: varchar('trade_name', { length: 160 }).notNull(),
  taxId: varchar('tax_id', { length: 40 }).notNull(),
  taxIdVerifiedAt: ts('tax_id_verified_at'),
  tourismRegistry: varchar('tourism_registry', { length: 40 }),
  tourismRegistryValidUntil: date('tourism_registry_valid_until'),
  description: text('description'),
  logoUrl: text('logo_url'),
  email: text('email').notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  city: varchar('city', { length: 80 }).notNull(),
  department: varchar('department', { length: 80 }).notNull(),
  country: char('country', { length: 2 }).notNull().default('CO'),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
  commissionRate: numeric('commission_rate', { precision: 5, scale: 4 })
    .notNull()
    .default('0.1200'),
  isActive: boolean('is_active').notNull().default(true),
  promiseFidelity: numeric('promise_fidelity', { precision: 4, scale: 2 }),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  deletedAt: ts('deleted_at'),
});

// --- Catálogo ---------------------------------------------------------------
export const category = pgTable('category', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  slug: text('slug').notNull(),
  nameEs: varchar('name_es', { length: 120 }).notNull(),
  parentId: uuid('parent_id'),
  icon: varchar('icon', { length: 60 }),
  riskCategory: riskCategory('risk_category').notNull().default('none'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const service = pgTable('service', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').notNull(),
  slug: text('slug').notNull(),
  name: varchar('name', { length: 160 }).notNull(),
  shortDescription: varchar('short_description', { length: 280 }),
  description: text('description').notNull(),
  categoryId: uuid('category_id').notNull(),
  modality: serviceModality('modality').notNull(),
  status: serviceStatus('status').notNull().default('draft'),
  pricingMode: pricingMode('pricing_mode').notNull().default('fixed'),
  basePrice: bigint('base_price', { mode: 'number' }),
  currency: char('currency', { length: 3 }).notNull().default('COP'),
  pricePer: varchar('price_per', { length: 20 }).notNull().default('person'),
  durationMinutes: integer('duration_minutes'),
  minParticipants: integer('min_participants').notNull().default(1),
  maxParticipants: integer('max_participants'),
  minAdvanceHours: integer('min_advance_hours').notNull().default(2),
  maxAdvanceDays: integer('max_advance_days').notNull().default(180),
  requiresConfirmation: boolean('requires_confirmation').notNull().default(false),
  locationMode: locationMode('location_mode').notNull().default('on_site'),
  city: varchar('city', { length: 80 }),
  department: varchar('department', { length: 80 }),
  latitude: numeric('latitude', { precision: 9, scale: 6 }),
  longitude: numeric('longitude', { precision: 9, scale: 6 }),
  cancellationPolicy: cancellationPolicy('cancellation_policy').notNull().default('moderate'),
  riskCategory: riskCategory('risk_category').notNull().default('none'),
  requiresWaiver: boolean('requires_waiver').notNull().default(false),
  minAge: integer('min_age'),
  accessibility: jsonb('accessibility').notNull().default({}),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
  expectationFidelity: numeric('expectation_fidelity', { precision: 4, scale: 2 }),
  reviewCount: integer('review_count').notNull().default(0),
  bookingCount: integer('booking_count').notNull().default(0),
  publishedAt: ts('published_at'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  deletedAt: ts('deleted_at'),
});

// --- Agenda -----------------------------------------------------------------
export const resource = pgTable('resource', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  organizationId: uuid('organization_id').notNull(),
  name: varchar('name', { length: 120 }).notNull(),
  kind: varchar('kind', { length: 30 }).notNull(),
  capacity: integer('capacity').notNull().default(1),
  accountId: uuid('account_id'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const serviceResource = pgTable('service_resource', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  serviceId: uuid('service_id').notNull(),
  resourceId: uuid('resource_id').notNull(),
  quantity: integer('quantity').notNull().default(1),
});

// --- Reservas ---------------------------------------------------------------
export const booking = pgTable('booking', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  code: varchar('code', { length: 12 }).notNull(),
  organizationId: uuid('organization_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  clientAccountId: uuid('client_account_id').notNull(),
  status: bookingStatus('status').notNull().default('draft'),
  startsAt: ts('starts_at'),
  endsAt: ts('ends_at'),
  participants: integer('participants').notNull().default(1),
  unitPrice: bigint('unit_price', { mode: 'number' }).notNull(),
  subtotal: bigint('subtotal', { mode: 'number' }).notNull(),
  discountAmount: bigint('discount_amount', { mode: 'number' }).notNull().default(0),
  platformFee: bigint('platform_fee', { mode: 'number' }).notNull().default(0),
  totalAmount: bigint('total_amount', { mode: 'number' }).notNull(),
  currency: char('currency', { length: 3 }).notNull().default('COP'),
  clientNotes: text('client_notes'),
  waiverSignedAt: ts('waiver_signed_at'),
  confirmedAt: ts('confirmed_at'),
  completedAt: ts('completed_at'),
  source: varchar('source', { length: 30 }).notNull().default('direct'),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

// booking_resource lleva la EXCLUDE USING gist; el rango se inserta con SQL crudo.
export const bookingResource = pgTable('booking_resource', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid('booking_id').notNull(),
  resourceId: uuid('resource_id').notNull(),
});

// --- Pagos y ledger ---------------------------------------------------------
export const payment = pgTable('payment', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid('booking_id'),
  organizationId: uuid('organization_id').notNull(),
  payerAccountId: uuid('payer_account_id').notNull(),
  status: paymentStatus('status').notNull().default('created'),
  method: varchar('method', { length: 20 }),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  currency: char('currency', { length: 3 }).notNull().default('COP'),
  gatewayFee: bigint('gateway_fee', { mode: 'number' }).notNull().default(0),
  provider: varchar('provider', { length: 30 }).notNull(),
  providerTransactionId: varchar('provider_transaction_id', { length: 160 }),
  heldAt: ts('held_at'),
  releasedAt: ts('released_at'),
  idempotencyKey: varchar('idempotency_key', { length: 120 }),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const ledgerEntry = pgTable('ledger_entry', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  transactionId: uuid('transaction_id').notNull(),
  accountType: ledgerAccount('account_type').notNull(),
  side: ledgerSide('side').notNull(),
  amount: bigint('amount', { mode: 'number' }).notNull(),
  currency: char('currency', { length: 3 }).notNull().default('COP'),
  organizationId: uuid('organization_id'),
  accountId: uuid('account_id'),
  bookingId: uuid('booking_id'),
  paymentId: uuid('payment_id'),
  taxKind: varchar('tax_kind', { length: 30 }),
  taxRate: numeric('tax_rate', { precision: 5, scale: 4 }),
  municipalityCode: varchar('municipality_code', { length: 10 }),
  description: text('description').notNull(),
  occurredAt: ts('occurred_at').notNull().defaultNow(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

// --- Reseñas ----------------------------------------------------------------
export const review = pgTable('review', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  bookingId: uuid('booking_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  authorAccountId: uuid('author_account_id').notNull(),
  status: reviewStatus('status').notNull().default('published'),
  comment: text('comment'),
  providerResponse: text('provider_response'),
  helpfulCount: integer('helpful_count').notNull().default(0),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

export const reviewAxis = pgTable('review_axis', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid('review_id').notNull(),
  kind: reviewAxisKind('kind').notNull(),
  value: numeric('value', { precision: 3, scale: 1 }).notNull(),
  note: text('note'),
  createdAt: ts('created_at').notNull().defaultNow(),
});

// Config de ejes de reseña por categoría (§ multi-rubro). scope 'venue' | 'product'.
export const categoryReviewAxis = pgTable('category_review_axis', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  categoryId: uuid('category_id').notNull(),
  scope: varchar('scope', { length: 10 }).notNull(),
  axisKey: varchar('axis_key', { length: 40 }).notNull(),
  labelEs: varchar('label_es', { length: 60 }).notNull(),
  valueScale: varchar('value_scale', { length: 10 }).notNull().default('1_5'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: ts('created_at').notNull().defaultNow(),
});

// Producto (plato/combo) dentro de un servicio, con métricas agregadas.
export const product = pgTable('product', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  serviceId: uuid('service_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  name: varchar('name', { length: 140 }).notNull(),
  description: text('description'),
  price: bigint('price', { mode: 'number' }),
  currency: char('currency', { length: 3 }).notNull().default('COP'),
  imageUrl: text('image_url'),
  isCombo: boolean('is_combo').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  avgRating: numeric('avg_rating', { precision: 3, scale: 2 }),
  reviewCount: integer('review_count').notNull().default(0),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
  deletedAt: ts('deleted_at'),
});

// Reseña de un producto (no atada a reserva). Una por persona y producto.
export const productReview = pgTable('product_review', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: uuid('product_id').notNull(),
  serviceId: uuid('service_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  authorAccountId: uuid('author_account_id').notNull(),
  status: reviewStatus('status').notNull().default('published'),
  comment: text('comment'),
  helpfulCount: integer('helpful_count').notNull().default(0),
  createdAt: ts('created_at').notNull().defaultNow(),
  updatedAt: ts('updated_at').notNull().defaultNow(),
});

// Ejes de la reseña de producto. axis_key libre (sabor, portion, product_value…).
export const productReviewAxis = pgTable('product_review_axis', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  reviewId: uuid('review_id').notNull(),
  axisKey: varchar('axis_key', { length: 40 }).notNull(),
  value: numeric('value', { precision: 3, scale: 1 }).notNull(),
  createdAt: ts('created_at').notNull().defaultNow(),
});

// --- Eventos de dominio (append-only) ---------------------------------------
export const domainEvent = pgTable('domain_event', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  eventType: varchar('event_type', { length: 80 }).notNull(),
  aggregateType: varchar('aggregate_type', { length: 60 }).notNull(),
  aggregateId: uuid('aggregate_id').notNull(),
  organizationId: uuid('organization_id'),
  actorAccountId: uuid('actor_account_id'),
  payload: jsonb('payload').notNull(),
  version: integer('version').notNull().default(1),
  occurredAt: ts('occurred_at').notNull().defaultNow(),
});
