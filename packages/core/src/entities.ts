import type {
  ApplicationStatus,
  BookingStatus,
  CampaignModel,
  CampaignStatus,
  CancellationPolicy,
  MembershipRole,
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

/** Membresía: qué cuenta opera qué organización y con qué rol (§10.1). */
export interface Membership {
  id: string;
  organizationId: string;
  accountId: string;
  role: MembershipRole;
  createdAt: Date;
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

/**
 * Perfil de creador (§12). Las métricas son calculadas a partir de audiencia
 * verificada y atribución; el creador nunca las declara.
 */
export interface CreatorProfile {
  id: string;
  accountId: string;
  handle: string;
  bio: string | null;
  categories: string[];
  cities: string[];
  languages: string[];
  isAcceptingWork: boolean;
  totalFollowers: number;
  avgEngagementRate: number | null;
  fidelityIndex: number | null;
  fidelitySampleSize: number;
  conversionRate: number | null;
  totalAttributedGmv: Money;
  onTimeDeliveryRate: number | null;
  avgRevisionRounds: number | null;
  createdAt: Date;
}

/**
 * Enlace social declarado por el creador. Fuente del scraping: de aquí se
 * descubre el contenido a transcribir y medir.
 */
export interface CreatorSocialLink {
  id: string;
  creatorProfileId: string;
  network: string;
  url: string;
  handle: string | null;
  status: 'pending' | 'verified' | 'failed';
  lastAnalyzedAt: Date | null;
}

/** Pieza de contenido raspada y transcrita. Dato de valor por ítem. */
export interface CreatorContentItem {
  id: string;
  creatorProfileId: string;
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

/** Insight agregado del creador, derivado del análisis de su contenido. */
export interface CreatorContentInsight {
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

/** Campaña / solicitud de contratación de creadores (§12). */
export interface Campaign {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  status: CampaignStatus;
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
  exclusivityDays: number;
  applicationsCloseAt: Date | null;
  contentDueAt: Date | null;
  totalReach: number;
  attributedBookings: number;
  attributedGmv: Money;
  roas: number | null;
  createdAt: Date;
}

/** Postulación o invitación de un creador a una campaña. */
export interface CampaignApplication {
  id: string;
  campaignId: string;
  creatorProfileId: string;
  status: ApplicationStatus;
  isInvitation: boolean;
  pitch: string | null;
  proposedFee: Money | null;
  matchScore: number | null;
  respondedAt: Date | null;
  createdAt: Date;
}
