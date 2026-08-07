import { describe, expect, it } from 'vitest';
import { ALL_PERMISSIONS, ROLE_PERMISSIONS, can, permissionsFor } from './permissions.js';

describe('RBAC de plataforma', () => {
  it('super_admin recibe todos los permisos, incluido roles:manage', () => {
    const perms = permissionsFor('super_admin');
    expect(perms).toEqual([...ALL_PERMISSIONS]);
    expect(can(perms, 'roles:manage')).toBe(true);
  });

  it('solo super_admin puede gestionar roles', () => {
    for (const role of ['moderator', 'finance', 'support', 'analyst'] as const) {
      expect(can(permissionsFor(role), 'roles:manage')).toBe(false);
    }
  });

  it('el moderador puede moderar pero no conciliar pagos', () => {
    const perms = permissionsFor('moderator');
    expect(can(perms, 'reviews:moderate')).toBe(true);
    expect(can(perms, 'services:moderate')).toBe(true);
    expect(can(perms, 'payments:reconcile')).toBe(false);
  });

  it('el analista es de solo lectura y no ve la auditoría', () => {
    const perms = permissionsFor('analyst');
    expect(can(perms, 'dashboard:read')).toBe(true);
    expect(can(perms, 'audit:read')).toBe(false);
    expect(can(perms, 'orgs:write')).toBe(false);
  });

  it('extra_permissions se suman al paquete del rol, sin duplicar y en orden estable', () => {
    const perms = permissionsFor('analyst', ['audit:read', 'dashboard:read']);
    expect(can(perms, 'audit:read')).toBe(true);
    // dashboard:read no se duplica
    expect(perms.filter((p) => p === 'dashboard:read')).toHaveLength(1);
    // el orden respeta ALL_PERMISSIONS
    const indices = perms.map((p) => ALL_PERMISSIONS.indexOf(p));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  it('cada rol declara un paquete de permisos', () => {
    for (const role of Object.keys(ROLE_PERMISSIONS)) {
      expect(ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS].length).toBeGreaterThan(0);
    }
  });
});
