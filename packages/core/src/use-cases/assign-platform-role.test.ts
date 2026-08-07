import { describe, expect, it } from 'vitest';
import type { Clock, DomainEventInput, PlatformStaff } from '../ports.js';
import type { AuditLogRecordInput } from '../ports.js';
import { assignPlatformRole } from './assign-platform-role.js';

const NOW = new Date('2026-08-07T10:00:00-05:00');
const clock: Clock = { now: () => NOW };

function makeDeps(seed: PlatformStaff[]) {
  const store = new Map<string, PlatformStaff>(seed.map((s) => [s.accountId, s]));
  const events: DomainEventInput[] = [];
  const audits: AuditLogRecordInput[] = [];

  const staff = {
    findByAccountId: async (id: string) => store.get(id) ?? null,
    list: async () => [...store.values()],
    upsert: async (input: {
      accountId: string;
      role: PlatformStaff['role'];
      extraPermissions: PlatformStaff['extraPermissions'];
      grantedBy: string | null;
    }) => {
      const saved: PlatformStaff = {
        accountId: input.accountId,
        role: input.role,
        extraPermissions: input.extraPermissions,
        grantedBy: input.grantedBy,
        createdAt: NOW,
      };
      store.set(input.accountId, saved);
      return saved;
    },
    revoke: async (id: string) => {
      store.delete(id);
    },
  };

  return {
    staff,
    events: { publish: async (e: DomainEventInput) => void events.push(e) },
    audit: { record: async (a: AuditLogRecordInput) => void audits.push(a) },
    clock,
    captured: { events, audits, store },
  };
}

const superAdmin: PlatformStaff = {
  accountId: 'acc-super',
  role: 'super_admin',
  extraPermissions: [],
  grantedBy: null,
  createdAt: NOW,
};

describe('assignPlatformRole', () => {
  it('un super_admin asigna un rol y deja rastro en evento y auditoría', async () => {
    const deps = makeDeps([superAdmin]);
    const res = await assignPlatformRole(deps, {
      actorAccountId: 'acc-super',
      targetAccountId: 'acc-nuevo',
      role: 'moderator',
      evidence: { ipAddress: '190.0.0.1', userAgent: 'test' },
    });
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.value.role).toBe('moderator');
    expect(deps.captured.store.get('acc-nuevo')?.role).toBe('moderator');
    expect(deps.captured.events[0]?.eventType).toBe('platform_staff.role_assigned');
    expect(deps.captured.audits[0]?.action).toBe('platform_staff.role_assigned');
    expect(deps.captured.audits[0]?.ipAddress).toBe('190.0.0.1');
  });

  it('rechaza si el actor no es staff de plataforma', async () => {
    const deps = makeDeps([]);
    const res = await assignPlatformRole(deps, {
      actorAccountId: 'acc-desconocido',
      targetAccountId: 'acc-nuevo',
      role: 'moderator',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NOT_AUTHORIZED');
    expect(deps.captured.events).toHaveLength(0);
  });

  it('rechaza si el actor no tiene roles:manage (p.ej. un moderador)', async () => {
    const deps = makeDeps([
      {
        accountId: 'acc-mod',
        role: 'moderator',
        extraPermissions: [],
        grantedBy: null,
        createdAt: NOW,
      },
    ]);
    const res = await assignPlatformRole(deps, {
      actorAccountId: 'acc-mod',
      targetAccountId: 'acc-nuevo',
      role: 'finance',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('NOT_AUTHORIZED');
  });

  it('reasignar es idempotente: cambia el rol de la misma cuenta', async () => {
    const deps = makeDeps([superAdmin]);
    await assignPlatformRole(deps, {
      actorAccountId: 'acc-super',
      targetAccountId: 'acc-x',
      role: 'support',
    });
    await assignPlatformRole(deps, {
      actorAccountId: 'acc-super',
      targetAccountId: 'acc-x',
      role: 'finance',
    });
    expect(deps.captured.store.get('acc-x')?.role).toBe('finance');
    // solo una fila para esa cuenta
    expect([...deps.captured.store.keys()].filter((k) => k === 'acc-x')).toHaveLength(1);
  });
});
