import type { Organization } from '../entities.js';
import { type DomainError, domainError } from '../errors.js';
import type {
  AccountRepository,
  EventPublisher,
  NewOrganizationLocationInput,
  OrganizationRepository,
} from '../ports.js';
import { type Result, err, ok } from '../result.js';

export interface ActivateBusinessProfileInput {
  accountId: string;
  legalName: string;
  tradeName: string;
  taxId: string;
  tourismRegistry?: string | null;
  /** Gremio / sector principal del negocio (p. ej. restaurante, hotel, spa). */
  sector?: string | null;
  /** Gremios / sectores (se pueden elegir varios). */
  sectors?: string[];
  /** Gremio personalizado si no está en la lista. */
  customSector?: string | null;
  /** Correo de la empresa; si no se envía, se usa el de la cuenta. */
  email?: string | null;
  phone: string;
  city: string;
  department: string;
  /** Sedes (locales) opcionales; se crean junto con la organización. */
  sedes?: NewOrganizationLocationInput[];
}

export interface ActivateBusinessProfileDeps {
  accounts: AccountRepository;
  organizations: OrganizationRepository;
  events: EventPublisher;
}

/** Slug legible a partir del nombre comercial. El repo resuelve colisiones. */
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/**
 * ActivateBusinessProfile — activa el perfil de Empresa sobre una cuenta existente (§10.1).
 *
 * Invariantes:
 *  - La cuenta debe existir.
 *  - El NIT (tax_id) es único en la plataforma.
 *  - Se crea la organización y su membresía `owner` de forma atómica (en el repo).
 *  - Queda PENDIENTE: sin verificación de NIT (cámara de comercio) ni RNT; el nivel
 *    de verificación de la cuenta no cambia aquí.
 */
export async function activateBusinessProfile(
  deps: ActivateBusinessProfileDeps,
  input: ActivateBusinessProfileInput,
): Promise<Result<Organization, DomainError>> {
  const { accounts, organizations, events } = deps;

  const account = await accounts.findById(input.accountId);
  if (!account) {
    return err(domainError('ACCOUNT_NOT_FOUND', 'La cuenta no existe'));
  }

  if (await organizations.existsByTaxId(input.taxId)) {
    return err(domainError('TAX_ID_TAKEN', 'Ya existe una empresa con ese NIT'));
  }

  const organization = await organizations.create({
    slug: slugify(input.tradeName),
    legalName: input.legalName,
    tradeName: input.tradeName,
    taxId: input.taxId,
    tourismRegistry: input.tourismRegistry ?? null,
    sector: input.sector ?? null,
    sectors: input.sectors ?? [],
    customSector: input.customSector ?? null,
    email: input.email ?? account.email,
    phone: input.phone,
    city: input.city,
    department: input.department,
    sedes: input.sedes ?? [],
    ownerAccountId: account.id,
  });

  await events.publish({
    eventType: 'organization.created',
    aggregateType: 'organization',
    aggregateId: organization.id,
    organizationId: organization.id,
    actorAccountId: account.id,
    payload: { tradeName: organization.tradeName, taxId: organization.taxId },
  });

  return ok(organization);
}
