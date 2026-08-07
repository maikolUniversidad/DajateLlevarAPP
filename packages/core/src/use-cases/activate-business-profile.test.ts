import { describe, expect, it } from 'vitest';
import type { Account, Membership, Organization } from '../entities.js';
import type {
  AccountRepository,
  DomainEventInput,
  EventPublisher,
  NewOrganizationInput,
  OrganizationRepository,
} from '../ports.js';
import { activateBusinessProfile, slugify } from './activate-business-profile.js';

const ACCOUNT: Account = {
  id: 'acc-1',
  email: 'dueno@example.co',
  emailVerifiedAt: null,
  phone: null,
  phoneVerifiedAt: null,
  fullName: 'Carlos Ríos',
  documentType: null,
  documentNumber: null,
  documentVerifiedAt: null,
};

function orgFrom(input: NewOrganizationInput): Organization {
  return {
    id: 'org-1',
    slug: input.slug,
    legalName: input.legalName,
    tradeName: input.tradeName,
    taxId: input.taxId,
    taxIdVerifiedAt: null,
    tourismRegistry: input.tourismRegistry ?? null,
    tourismRegistryValidUntil: null,
    commissionRate: 0.12,
    isActive: true,
  };
}

function makeDeps(opts?: { missingAccount?: boolean; taxIdTaken?: boolean }) {
  const events: DomainEventInput[] = [];
  const createdOrgs: NewOrganizationInput[] = [];
  const memberships: Membership[] = [];

  const accounts = {
    findById: async (id: string) => (opts?.missingAccount ? null : { ...ACCOUNT, id }),
  } as unknown as AccountRepository;

  const organizations: OrganizationRepository = {
    findById: async () => null,
    existsByTaxId: async () => !!opts?.taxIdTaken,
    create: async (input) => {
      createdOrgs.push(input);
      const org = orgFrom(input);
      // El repo real crea la membresía owner de forma atómica; aquí lo simulamos.
      memberships.push({
        id: 'mem-1',
        organizationId: org.id,
        accountId: input.ownerAccountId,
        role: 'owner',
        createdAt: new Date('2026-08-07T10:00:00-05:00'),
      });
      return org;
    },
  };

  const eventPub: EventPublisher = {
    publish: async (e) => {
      events.push(e);
    },
  };

  return { accounts, organizations, events: eventPub, createdOrgs, memberships, captured: events };
}

const baseInput = {
  accountId: ACCOUNT.id,
  legalName: 'Sabores del Llano S.A.S.',
  tradeName: 'Sabores del Llano',
  taxId: '901234567-8',
  phone: '3201234567',
  city: 'Villavicencio',
  department: 'Meta',
};

describe('slugify', () => {
  it('normaliza tildes y espacios', () => {
    expect(slugify('Sabores del Llano')).toBe('sabores-del-llano');
    expect(slugify('Café Bogotá')).toBe('cafe-bogota');
  });
});

describe('activateBusinessProfile', () => {
  it('crea la organización con membresía owner y publica el evento', async () => {
    const deps = makeDeps();
    const res = await activateBusinessProfile(deps, baseInput);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.tradeName).toBe('Sabores del Llano');
    expect(deps.createdOrgs[0]?.slug).toBe('sabores-del-llano');
    // Usa el correo de la cuenta si no se envía uno de empresa.
    expect(deps.createdOrgs[0]?.email).toBe(ACCOUNT.email);
    // Membresía owner creada de forma atómica.
    expect(deps.memberships[0]?.role).toBe('owner');
    expect(deps.captured[0]?.eventType).toBe('organization.created');
  });

  it('pasa el sector y las sedes al repositorio para persistirlos', async () => {
    const deps = makeDeps();
    const res = await activateBusinessProfile(deps, {
      ...baseInput,
      sector: 'restaurante',
      sedes: [
        {
          name: 'Sede Centro',
          address: 'Cra 30 #40-12',
          city: 'Villavicencio',
          department: 'Meta',
        },
        { name: 'Sede Norte', city: 'Villavicencio', department: 'Meta' },
      ],
    });
    expect(res.ok).toBe(true);
    expect(deps.createdOrgs[0]?.sector).toBe('restaurante');
    expect(deps.createdOrgs[0]?.sedes).toHaveLength(2);
    expect(deps.createdOrgs[0]?.sedes?.[0]?.name).toBe('Sede Centro');
    expect(deps.createdOrgs[0]?.sedes?.[0]?.address).toBe('Cra 30 #40-12');
    expect(deps.createdOrgs[0]?.sedes?.[1]?.name).toBe('Sede Norte');
  });

  it('crea la organización sin sedes cuando no se envían', async () => {
    const deps = makeDeps();
    const res = await activateBusinessProfile(deps, baseInput);
    expect(res.ok).toBe(true);
    // sedes por defecto es una lista vacía (nunca undefined al llegar al repo).
    expect(deps.createdOrgs[0]?.sedes).toEqual([]);
    expect(deps.createdOrgs[0]?.sector).toBeNull();
  });

  it('rechaza si la cuenta no existe', async () => {
    const deps = makeDeps({ missingAccount: true });
    const res = await activateBusinessProfile(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('ACCOUNT_NOT_FOUND');
    expect(deps.createdOrgs).toHaveLength(0);
  });

  it('rechaza si el NIT ya está registrado', async () => {
    const deps = makeDeps({ taxIdTaken: true });
    const res = await activateBusinessProfile(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('TAX_ID_TAKEN');
    expect(deps.createdOrgs).toHaveLength(0);
  });
});
