import { describe, expect, it } from 'vitest';
import type { Account } from '../entities.js';
import type {
  AccountRepository,
  AuthProvider,
  Clock,
  ConsentRepository,
  DomainEventInput,
  EventPublisher,
  PolicyVersion,
  PolicyVersionRepository,
} from '../ports.js';
import { registerAccount } from './register-account.js';

const NOW = new Date('2026-08-07T10:00:00-05:00');
const clock: Clock = { now: () => NOW };

function policy(purpose: PolicyVersion['purpose']): PolicyVersion {
  return {
    id: `pol-${purpose}`,
    purpose,
    version: '1.0',
    contentUrl: `/legal/${purpose}`,
    contentHash: 'abc',
  };
}

function makeDeps(opts?: {
  existingEmail?: string;
  missingPolicies?: boolean;
  authThrows?: boolean;
}) {
  const consentRecords: unknown[] = [];
  const events: DomainEventInput[] = [];
  const accountsStore: Account[] = [];

  const auth: AuthProvider = {
    verifyToken: async () => null,
    signIn: async () => null,
    createUser: async () => {
      if (opts?.authThrows) throw new Error('supabase down');
      return { externalUserId: 'ext-123' };
    },
  };
  const accounts: AccountRepository = {
    findById: async (id) => accountsStore.find((a) => a.id === id) ?? null,
    findByExternalAuthId: async () => null,
    findByEmail: async (email) =>
      opts?.existingEmail === email
        ? ({ id: 'acc-existing', email } as Account)
        : (accountsStore.find((a) => a.email === email) ?? null),
    create: async (input) => {
      const acc = {
        id: 'acc-new',
        email: input.email,
        fullName: input.fullName,
        phone: input.phone ?? null,
        emailVerifiedAt: null,
        phoneVerifiedAt: null,
        documentType: null,
        documentNumber: null,
        documentVerifiedAt: null,
      } as Account;
      accountsStore.push(acc);
      return acc;
    },
    update: async (_id, _p) => accountsStore[0]!,
    softDelete: async () => {},
  };
  const policies: PolicyVersionRepository = {
    latestFor: async (purpose) => (opts?.missingPolicies ? null : policy(purpose)),
  };
  const consents: ConsentRepository = {
    record: async (r) => {
      consentRecords.push(r);
    },
    currentFor: async () => [],
  };
  const eventPub: EventPublisher = {
    publish: async (e) => {
      events.push(e);
    },
  };

  return {
    auth,
    accounts,
    policies,
    consents,
    events: eventPub,
    clock,
    consentRecords,
    captured: events,
  };
}

const baseInput = {
  email: 'lucia@example.co',
  password: 'contrasena-segura',
  fullName: 'Lucía Moreno',
  acceptMarketing: false,
  evidence: { ipAddress: '190.0.0.1', userAgent: 'test' },
};

describe('registerAccount', () => {
  it('registra la cuenta y asienta términos + privacidad + marketing', async () => {
    const deps = makeDeps();
    const res = await registerAccount(deps, { ...baseInput, acceptMarketing: true });
    expect(res.ok).toBe(true);
    // 3 consentimientos: terms, privacy, marketing
    expect(deps.consentRecords).toHaveLength(3);
    const purposes = deps.consentRecords.map((r) => (r as { purpose: string }).purpose).sort();
    expect(purposes).toEqual(['marketing', 'privacy', 'terms']);
    // Cada asiento lleva la prueba (IP + user agent)
    for (const r of deps.consentRecords) {
      expect((r as { evidence: { ipAddress: string } }).evidence.ipAddress).toBe('190.0.0.1');
    }
    expect(deps.captured[0]?.eventType).toBe('account.registered');
  });

  it('registra marketing como no otorgado si no se aceptó', async () => {
    const deps = makeDeps();
    await registerAccount(deps, { ...baseInput, acceptMarketing: false });
    const mkt = deps.consentRecords.find((r) => (r as { purpose: string }).purpose === 'marketing');
    expect((mkt as { granted: boolean }).granted).toBe(false);
  });

  it('rechaza si el correo ya existe', async () => {
    const deps = makeDeps({ existingEmail: baseInput.email });
    const res = await registerAccount(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('EMAIL_TAKEN');
    expect(deps.consentRecords).toHaveLength(0);
  });

  it('rechaza si las políticas no están configuradas', async () => {
    const deps = makeDeps({ missingPolicies: true });
    const res = await registerAccount(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('POLICY_NOT_CONFIGURED');
  });

  it('no crea cuenta si el proveedor de auth falla', async () => {
    const deps = makeDeps({ authThrows: true });
    const res = await registerAccount(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('AUTH_FAILED');
    expect(deps.consentRecords).toHaveLength(0);
  });
});
