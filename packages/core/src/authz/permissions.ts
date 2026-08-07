import type { Permission, PlatformRole } from '@dejatellevar/contracts';

/**
 * RBAC de plataforma — lógica pura (regla de oro: sin SDKs, solo TS).
 *
 * Un PlatformRole es un paquete de permisos granulares. El acceso efectivo de una
 * cuenta es la unión del paquete de su rol más sus `extraPermissions` sueltos.
 * La API decide con `can(...)`; el dominio nunca conoce Hono ni la base de datos.
 */

export type { Permission, PlatformRole };

/** Todos los permisos conocidos, en orden estable (útil para UI y pruebas). */
export const ALL_PERMISSIONS: readonly Permission[] = [
  'dashboard:read',
  'orgs:read',
  'orgs:write',
  'accounts:read',
  'accounts:write',
  'services:moderate',
  'reviews:moderate',
  'disputes:read',
  'disputes:resolve',
  'fraud:read',
  'fraud:action',
  'payments:reconcile',
  'compliance:read',
  'taxonomy:write',
  'policies:write',
  'ai:read',
  'integrations:read',
  'events:read',
  'audit:read',
  'roles:manage',
] as const;

/** Permisos que otorga cada rol. super_admin recibe todos, incluido roles:manage. */
export const ROLE_PERMISSIONS: Record<PlatformRole, readonly Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  moderator: [
    'services:moderate',
    'reviews:moderate',
    'fraud:read',
    'fraud:action',
    'disputes:read',
    'accounts:read',
    'events:read',
    'audit:read',
  ],
  finance: [
    'payments:reconcile',
    'disputes:read',
    'disputes:resolve',
    'orgs:read',
    'dashboard:read',
    'events:read',
    'audit:read',
  ],
  support: [
    'accounts:read',
    'orgs:read',
    'disputes:read',
    'compliance:read',
    'events:read',
    'audit:read',
  ],
  analyst: ['dashboard:read', 'ai:read', 'orgs:read', 'accounts:read', 'events:read'],
};

/**
 * Permisos efectivos de un rol, sumando permisos sueltos. Devuelve un conjunto
 * sin duplicados, en el orden estable de ALL_PERMISSIONS.
 */
export function permissionsFor(
  role: PlatformRole,
  extra: readonly Permission[] = [],
): Permission[] {
  const granted = new Set<Permission>([...ROLE_PERMISSIONS[role], ...extra]);
  return ALL_PERMISSIONS.filter((p) => granted.has(p));
}

/** ¿El conjunto de permisos incluye el requerido? */
export function can(permissions: readonly Permission[], required: Permission): boolean {
  return permissions.includes(required);
}
