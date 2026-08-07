import type { Money } from '@dejatellevar/contracts';
import type { Account, Booking, Organization, Service } from './entities.js';

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

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
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
