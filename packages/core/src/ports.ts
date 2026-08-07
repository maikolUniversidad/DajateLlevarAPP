import type { Money } from '@dejatellevar/contracts';
import type { Account, Booking, Organization, Service } from './entities.js';

/**
 * PUERTOS — la regla de oro hecha código.
 * El dominio depende de estas interfaces, nunca de implementaciones concretas.
 * Los adaptadores (Supabase, Wompi, etc.) viven en otros paquetes.
 */

// --- Proveedores externos ---------------------------------------------------

export interface AuthProvider {
  verifyToken(token: string): Promise<{ accountId: string } | null>;
  createUser(input: { email: string; password: string; fullName: string }): Promise<{
    accountId: string;
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

export interface AccountRepository {
  findById(id: string): Promise<Account | null>;
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
