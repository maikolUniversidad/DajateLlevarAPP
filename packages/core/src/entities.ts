import type {
  BookingStatus,
  CancellationPolicy,
  Money,
  RiskCategory,
  ServiceModality,
  ServiceStatus,
} from '@dejatellevar/contracts';

/**
 * Entidades del dominio. Tipos puros: sin decoradores, sin ORM, sin proveedor.
 * La persistencia vive en packages/db; aquí solo la forma y las invariantes.
 */

export interface Account {
  id: string;
  email: string;
  emailVerifiedAt: Date | null;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  fullName: string;
  documentType: string | null;
  documentNumber: string | null;
  documentVerifiedAt: Date | null;
}

export interface Organization {
  id: string;
  slug: string;
  legalName: string;
  tradeName: string;
  taxId: string;
  taxIdVerifiedAt: Date | null;
  tourismRegistry: string | null;
  tourismRegistryValidUntil: Date | null;
  commissionRate: number; // 0.1200 = 12%
  isActive: boolean;
}

export interface Service {
  id: string;
  organizationId: string;
  slug: string;
  name: string;
  modality: ServiceModality;
  status: ServiceStatus;
  basePrice: Money | null;
  minParticipants: number;
  maxParticipants: number | null;
  durationMinutes: number | null;
  minAdvanceHours: number;
  maxAdvanceDays: number;
  cancellationPolicy: CancellationPolicy;
  riskCategory: RiskCategory;
  requiresWaiver: boolean;
  minAge: number | null;
}

export interface Booking {
  id: string;
  code: string;
  organizationId: string;
  serviceId: string;
  clientAccountId: string;
  status: BookingStatus;
  startsAt: Date | null;
  endsAt: Date | null;
  participants: number;
  unitPrice: Money;
  subtotal: Money;
  platformFee: Money;
  totalAmount: Money;
  waiverSignedAt: Date | null;
}
