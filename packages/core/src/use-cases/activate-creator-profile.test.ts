import { describe, expect, it } from 'vitest';
import type { Account, CreatorProfile } from '../entities.js';
import type {
  AccountRepository,
  CreatorRepository,
  DomainEventInput,
  EventPublisher,
  NewCreatorProfileInput,
} from '../ports.js';
import { activateCreatorProfile } from './activate-creator-profile.js';

const ACCOUNT: Account = {
  id: 'acc-1',
  email: 'lucia@example.co',
  emailVerifiedAt: null,
  phone: null,
  phoneVerifiedAt: null,
  fullName: 'Lucía Moreno',
  documentType: null,
  documentNumber: null,
  documentVerifiedAt: null,
};

function creatorFrom(input: NewCreatorProfileInput): CreatorProfile {
  return {
    id: 'crt-1',
    accountId: input.accountId,
    handle: input.handle,
    bio: input.bio ?? null,
    categories: input.categories,
    cities: input.cities,
    languages: ['es'],
    isAcceptingWork: true,
    totalFollowers: 0,
    avgEngagementRate: null,
    fidelityIndex: null,
    fidelitySampleSize: 0,
    conversionRate: null,
    totalAttributedGmv: { amount: 0, currency: 'COP' },
    onTimeDeliveryRate: null,
    avgRevisionRounds: null,
    createdAt: new Date('2026-08-07T10:00:00-05:00'),
  };
}

function makeDeps(opts?: {
  missingAccount?: boolean;
  existingProfile?: boolean;
  handleTaken?: boolean;
}) {
  const events: DomainEventInput[] = [];
  const created: NewCreatorProfileInput[] = [];

  const accounts = {
    findById: async (id: string) => (opts?.missingAccount ? null : { ...ACCOUNT, id }),
  } as unknown as AccountRepository;

  const creators: CreatorRepository = {
    findById: async () => null,
    findByHandle: async (handle) =>
      opts?.handleTaken
        ? creatorFrom({ accountId: 'x', handle, categories: [], cities: [] })
        : null,
    findByAccountId: async () =>
      opts?.existingProfile
        ? creatorFrom({ accountId: ACCOUNT.id, handle: 'existente', categories: [], cities: [] })
        : null,
    create: async (input) => {
      created.push(input);
      return creatorFrom(input);
    },
  };

  const eventPub: EventPublisher = {
    publish: async (e) => {
      events.push(e);
    },
  };

  return { accounts, creators, events: eventPub, created, captured: events };
}

const baseInput = {
  accountId: ACCOUNT.id,
  handle: 'lucia.llano',
  bio: 'Creadora del Meta',
  categories: ['gastronomia'],
  cities: ['Villavicencio'],
};

describe('activateCreatorProfile', () => {
  it('activa el perfil y publica el evento', async () => {
    const deps = makeDeps();
    const res = await activateCreatorProfile(deps, baseInput);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.handle).toBe('lucia.llano');
    // Métricas en cero: se calculan, no se declaran.
    if (res.ok) expect(res.value.totalFollowers).toBe(0);
    expect(deps.created).toHaveLength(1);
    expect(deps.captured[0]?.eventType).toBe('creator_profile.activated');
  });

  it('rechaza si la cuenta no existe', async () => {
    const deps = makeDeps({ missingAccount: true });
    const res = await activateCreatorProfile(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('ACCOUNT_NOT_FOUND');
    expect(deps.created).toHaveLength(0);
  });

  it('rechaza si la cuenta ya tiene perfil de creador', async () => {
    const deps = makeDeps({ existingProfile: true });
    const res = await activateCreatorProfile(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('CREATOR_PROFILE_EXISTS');
    expect(deps.created).toHaveLength(0);
  });

  it('rechaza si el handle ya está tomado', async () => {
    const deps = makeDeps({ handleTaken: true });
    const res = await activateCreatorProfile(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('HANDLE_TAKEN');
    expect(deps.created).toHaveLength(0);
  });
});
