import type { CampaignModel, MembershipRole, Money, PlatformRole } from '@dejatellevar/contracts';
import type { Permission } from './authz/permissions.js';
import type {
  Account,
  Booking,
  Campaign,
  CampaignApplication,
  CreatorContentInsight,
  CreatorContentItem,
  CreatorProfile,
  CreatorSocialLink,
  Membership,
  Organization,
  Service,
} from './entities.js';

/**
 * PUERTOS — la regla de oro hecha código.
 * El dominio depende de estas interfaces, nunca de implementaciones concretas.
 * Los adaptadores (Supabase, Wompi, etc.) viven en otros paquetes.
 */

// --- Proveedores externos ---------------------------------------------------

export interface AuthProvider {
  /** Devuelve el id del usuario en el proveedor externo (no nuestro account.id). */
  verifyToken(token: string): Promise<{ externalUserId: string } | null>;
  createUser(input: { email: string; password: string; fullName: string }): Promise<{
    externalUserId: string;
  }>;
  signIn(input: { email: string; password: string }): Promise<{ token: string } | null>;
}

export interface StorageProvider {
  getUploadUrl(input: { key: string; contentType: string }): Promise<{
    url: string;
    fields?: Record<string, string>;
  }>;
  getPublicUrl(key: string): string;
}

export interface PaymentIntent {
  id: string;
  status: 'created' | 'authorized' | 'held' | 'released' | 'failed';
  amount: Money;
}

export interface PaymentProvider {
  /** Crea un cobro retenido (escrow) contra una reserva. */
  createHold(input: {
    amount: Money;
    reference: string;
    method: string;
    idempotencyKey: string;
  }): Promise<PaymentIntent>;
  release(paymentId: string): Promise<PaymentIntent>;
  refund(input: { paymentId: string; amount: Money }): Promise<PaymentIntent>;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
}

export interface DomainEventInput {
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  organizationId?: string | null;
  actorAccountId?: string | null;
  payload: Record<string, unknown>;
}

export interface EventPublisher {
  publish(event: DomainEventInput): Promise<void>;
}

export interface SocialProvider {
  fetchAudience(input: { network: string; handle: string }): Promise<{
    followers: number;
    engagementRate: number;
    demographics: Record<string, unknown>;
  }>;
}

/**
 * Pieza de contenido tal como la devuelve el scraping (antes de transcribir).
 * `mediaUrl` apunta al video/audio a transcribir cuando aplica.
 */
export interface ScrapedContentItem {
  externalId: string | null;
  kind: string;
  url: string;
  title: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  durationSeconds: number | null;
  publishedAt: Date | null;
  mediaUrl: string | null;
  caption: string | null;
}

export interface ScrapedProfile {
  network: string;
  networkUserId: string | null;
  handle: string | null;
  followers: number;
  items: ScrapedContentItem[];
}

/**
 * Proveedor de scraping de contenido social. Adaptador externo (APIs de
 * plataforma / raspado). El dominio solo conoce esta interfaz.
 */
export interface ContentScrapingProvider {
  /** Trae el perfil público y su contenido reciente para una red + enlace. */
  fetchProfile(input: { network: string; url: string }): Promise<ScrapedProfile>;
}

/** Transcribe medios (video/audio) a texto con el idioma detectado. */
export interface TranscriptionProvider {
  transcribe(input: { mediaUrl: string; network: string }): Promise<{
    text: string;
    language: string;
    durationSeconds: number | null;
  }>;
}

/** Un ítem listo para clasificar (transcripción + caption + métricas). */
export interface AnalyzableItem {
  network: string;
  kind: string;
  transcript: string | null;
  caption: string | null;
  views: number;
}

export interface ContentAnalysisResult {
  suggestedCategories: string[];
  topTopics: string[];
  audience: {
    primaryAgeRange: string | null;
    topCities: string[];
    languages: string[];
    interests: string[];
  };
  brandSafety: 'safe' | 'review' | 'unsafe';
  /** Temas por ítem, alineados al orden de `items` de entrada. */
  itemTopics: string[][];
}

/**
 * Clasificador de contenido (típicamente sobre un LLM). Deriva categoría,
 * audiencia y temas a partir de transcripciones y captions. Nunca declarado.
 */
export interface ContentAnalyzer {
  analyze(input: {
    items: AnalyzableItem[];
    declaredCategories: string[];
  }): Promise<ContentAnalysisResult>;
}

export interface LLMProvider {
  generate<T>(input: {
    useCase: string;
    prompt: string;
    schema: { parse: (v: unknown) => T };
  }): Promise<{ value: T; tokensInput: number; tokensOutput: number; model: string }>;
}

/** Reloj inyectable: nada de `new Date()` disperso en el dominio. */
export interface Clock {
  now(): Date;
}

// --- Repositorios -----------------------------------------------------------

export interface ServiceRepository {
  findById(organizationId: string | null, id: string): Promise<Service | null>;
}

/** Sede (local) de una organización, creada junto con ella en el alta. */
export interface NewOrganizationLocationInput {
  name: string;
  address?: string | null;
  city: string;
  department: string;
  latitude?: number | null;
  longitude?: number | null;
}

export interface NewOrganizationInput {
  /** Slug base derivado del nombre comercial; el repo garantiza unicidad. */
  slug: string;
  legalName: string;
  tradeName: string;
  taxId: string;
  tourismRegistry?: string | null;
  /** Gremio / sector PRINCIPAL del negocio (p. ej. restaurante, hotel, spa). */
  sector?: string | null;
  /** Gremios / sectores del negocio (se pueden elegir varios). */
  sectors?: string[];
  /** Gremio personalizado escrito por el usuario si no está en la lista. */
  customSector?: string | null;
  email: string;
  phone: string;
  city: string;
  department: string;
  /** Sedes (locales) opcionales; se crean en la misma transacción que la org. */
  sedes?: NewOrganizationLocationInput[];
  /** Cuenta que queda como dueña (rol owner) de la organización. */
  ownerAccountId: string;
}

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  /** ¿Ya hay una organización con ese NIT? (tax_id es único). */
  existsByTaxId(taxId: string): Promise<boolean>;
  /**
   * Crea la organización y su membresía `owner` de forma atómica. Resuelve
   * colisiones de slug internamente. Deja el NIT/RNT sin verificar (pendiente).
   */
  create(input: NewOrganizationInput): Promise<Organization>;
}

/** Vista de membresía para GET /me: organización + rol de la cuenta. */
export interface MembershipView {
  organizationId: string;
  tradeName: string;
  role: MembershipRole;
}

export interface MembershipRepository {
  create(input: {
    organizationId: string;
    accountId: string;
    role: MembershipRole;
  }): Promise<Membership>;
  /** Membresías activas de una cuenta, con el nombre comercial de cada org. */
  findByAccountId(accountId: string): Promise<MembershipView[]>;
}

export interface NewAccountInput {
  email: string;
  fullName: string;
  phone?: string | null;
  externalAuthId: string;
}

export interface AccountUpdate {
  fullName?: string;
  displayName?: string | null;
  phone?: string | null;
  city?: string | null;
  department?: string | null;
}

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
  findByExternalAuthId(externalAuthId: string): Promise<Account | null>;
  findByEmail(email: string): Promise<Account | null>;
  /** Crea la cuenta y su perfil de cliente (siempre activo). */
  create(input: NewAccountInput): Promise<Account>;
  update(id: string, patch: AccountUpdate): Promise<Account>;
  /** Baja lógica de la cuenta (derecho de supresión, Ley 1581). */
  softDelete(id: string): Promise<void>;
}

// --- Consentimiento y cumplimiento (Ley 1581 de 2012) -----------------------

export type ConsentPurpose =
  | 'terms'
  | 'privacy'
  | 'marketing'
  | 'sensitive_accessibility'
  | 'ai_processing'
  | 'data_sharing';

export interface PolicyVersion {
  id: string;
  purpose: ConsentPurpose;
  version: string;
  contentUrl: string;
  contentHash: string;
}

export interface ConsentState {
  purpose: ConsentPurpose;
  granted: boolean;
  grantedAt: Date | null;
  revokedAt: Date | null;
  policyVersion: string;
}

/** Contexto probatorio del consentimiento: un booleano no basta (Ley 1581). */
export interface ConsentEvidence {
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface PolicyVersionRepository {
  /** Última versión vigente de una política por propósito. */
  latestFor(purpose: ConsentPurpose): Promise<PolicyVersion | null>;
}

export interface ConsentRepository {
  /** Registra un asiento de consentimiento (append: cada cambio es un registro). */
  record(input: {
    accountId: string;
    policyVersionId: string;
    purpose: ConsentPurpose;
    granted: boolean;
    evidence: ConsentEvidence;
  }): Promise<void>;
  /** Estado actual (último asiento) de cada propósito para una cuenta. */
  currentFor(accountId: string): Promise<ConsentState[]>;
}

export interface DataSubjectRequestRepository {
  create(input: {
    accountId: string;
    kind: 'export' | 'delete' | 'rectify';
    notes?: string | null;
  }): Promise<{ id: string; status: string }>;
}

export interface AvailabilityPort {
  /** ¿Están libres los recursos del servicio en ese rango? Se apoya en la exclusión GiST. */
  isSlotAvailable(input: {
    serviceId: string;
    startsAt: Date;
    endsAt: Date;
    participants: number;
  }): Promise<boolean>;
}

export interface BookingRepository {
  /**
   * Persiste la reserva reservando sus recursos de forma atómica.
   * Debe devolver DOUBLE_BOOKING si la exclusión GiST rechaza el rango.
   */
  create(input: {
    booking: Omit<Booking, 'id' | 'code'>;
    resourceIds: string[];
  }): Promise<{ ok: true; booking: Booking } | { ok: false; reason: 'DOUBLE_BOOKING' }>;
  nextCode(): Promise<string>;
}

// --- Creadores y campañas (§12) ---------------------------------------------

export interface NewCreatorProfileInput {
  accountId: string;
  handle: string;
  bio?: string | null;
  categories: string[];
  cities: string[];
  /** Estilo(s) de contenido declarados (cómo describe lo que hace). */
  contentStyles?: string[];
  /** Formatos que produce (reel, video largo, en vivo…). */
  formats?: string[];
  /** Audiencia declarada (segmentación descriptiva; NO métricas calculadas). */
  declaredAudience?: Record<string, unknown> | null;
}

export interface CreatorRepository {
  findById(id: string): Promise<CreatorProfile | null>;
  findByHandle(handle: string): Promise<CreatorProfile | null>;
  findByAccountId(accountId: string): Promise<CreatorProfile | null>;
  /** Activa el perfil de creador. Métricas en cero: se calculan, no se declaran. */
  create(input: NewCreatorProfileInput): Promise<CreatorProfile>;
}

export interface NewSocialLinkInput {
  network: string;
  url: string;
  handle: string | null;
}

export interface NewContentItemInput {
  network: string;
  kind: string;
  externalId: string | null;
  url: string;
  title: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  durationSeconds: number | null;
  publishedAt: Date | null;
  transcript: string | null;
  language: string | null;
  topics: string[];
  analyzedAt: Date | null;
}

export interface NewContentInsightInput {
  creatorProfileId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  itemsAnalyzed: number;
  totalViews: number;
  avgViews: number;
  avgEngagementRate: number | null;
  suggestedCategories: string[];
  topTopics: string[];
  audience: {
    primaryAgeRange: string | null;
    topCities: string[];
    languages: string[];
    interests: string[];
  };
  brandSafety: 'safe' | 'review' | 'unsafe';
  networks: { network: string; followers: number; avgViews: number; items: number }[];
  analyzedAt: Date | null;
}

/**
 * Enlaces sociales, contenido raspado e insight del creador. Es la capa de datos
 * del scraping: enlaces (entrada), ítems transcritos (dato por pieza) e insight
 * agregado (categoría/audiencia calculadas, nunca declaradas).
 */
export interface CreatorContentRepository {
  listSocialLinks(creatorProfileId: string): Promise<CreatorSocialLink[]>;
  /** Reemplaza el conjunto de enlaces del creador (upsert idempotente por red). */
  replaceSocialLinks(
    creatorProfileId: string,
    links: NewSocialLinkInput[],
  ): Promise<CreatorSocialLink[]>;
  markLinkAnalyzed(input: {
    id: string;
    status: 'verified' | 'failed';
    at: Date;
  }): Promise<void>;
  /** Reemplaza las piezas analizadas del creador por el nuevo lote. */
  replaceContentItems(
    creatorProfileId: string,
    items: NewContentItemInput[],
  ): Promise<CreatorContentItem[]>;
  listContentItems(creatorProfileId: string): Promise<CreatorContentItem[]>;
  saveInsight(input: NewContentInsightInput): Promise<CreatorContentInsight>;
  getInsight(creatorProfileId: string): Promise<CreatorContentInsight | null>;
}

export interface NewCampaignInput {
  organizationId: string;
  code: string;
  name: string;
  model: CampaignModel;
  objective: string;
  targetAudience: string | null;
  keyMessages: string | null;
  doNotMention: string | null;
  referenceUrls: string[];
  serviceIds: string[];
  targetCities: string[];
  targetCategories: string[];
  budgetTotal: Money | null;
  feePerCreator: Money | null;
  commissionRate: number | null;
  contentLicense: string;
  licenseDurationDays: number | null;
  exclusivityDays: number;
  applicationsCloseAt: Date | null;
  contentDueAt: Date | null;
}

export interface NewApplicationInput {
  campaignId: string;
  creatorProfileId: string;
  isInvitation: boolean;
  pitch: string | null;
  proposedFee: Money | null;
}

export interface CampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  create(input: NewCampaignInput): Promise<Campaign>;
  /** Código único legible de campaña (varchar(12)). */
  nextCode(): Promise<string>;
  findApplication(
    campaignId: string,
    creatorProfileId: string,
  ): Promise<CampaignApplication | null>;
  addApplication(input: NewApplicationInput): Promise<CampaignApplication>;
}

// --- Administración de plataforma (backoffice) ------------------------------

/** Página por cursor: eco del contrato de paginación de la API. */
export interface Page<T> {
  data: T[];
  nextCursor: string | null;
}

/** Staff de plataforma: quién es admin del backoffice y con qué rol/permisos. */
export interface PlatformStaff {
  accountId: string;
  role: PlatformRole;
  extraPermissions: Permission[];
  grantedBy: string | null;
  createdAt: Date;
}

export interface PlatformStaffRepository {
  findByAccountId(accountId: string): Promise<PlatformStaff | null>;
  list(): Promise<PlatformStaff[]>;
  /** Alta o cambio de rol (idempotente por account_id). */
  upsert(input: {
    accountId: string;
    role: PlatformRole;
    extraPermissions: Permission[];
    grantedBy: string | null;
  }): Promise<PlatformStaff>;
  /** Baja lógica del staff. */
  revoke(accountId: string): Promise<void>;
}

/** Una acción registrada en el log de auditoría (append-only, inmutable). */
export interface AuditLogEntry {
  id: string;
  actorAccountId: string | null;
  actorKind: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  organizationId: string | null;
  ipAddress: string | null;
  occurredAt: Date;
}

export interface AuditLogRecordInput {
  actorAccountId?: string | null;
  actorKind: 'user' | 'system' | 'api_client' | 'mcp_client';
  action: string;
  resourceType: string;
  resourceId?: string | null;
  organizationId?: string | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/** Escribe en el log de auditoría. Nunca lanza por reglas de negocio. */
export interface AuditLogRecorder {
  record(input: AuditLogRecordInput): Promise<void>;
}

export interface AuditLogFilters {
  actorAccountId?: string;
  resourceType?: string;
  action?: string;
  from?: Date;
  to?: Date;
}

export interface AuditLogQueryPort {
  list(
    filters: AuditLogFilters,
    page: { cursor?: string; limit: number },
  ): Promise<Page<AuditLogEntry>>;
}

export interface DomainEventRecord {
  id: string;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  organizationId: string | null;
  actorAccountId: string | null;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface DomainEventFilters {
  eventType?: string;
  aggregateType?: string;
  aggregateId?: string;
  organizationId?: string;
  from?: Date;
  to?: Date;
}

export interface DomainEventQueryPort {
  list(
    filters: DomainEventFilters,
    page: { cursor?: string; limit: number },
  ): Promise<Page<DomainEventRecord>>;
}
