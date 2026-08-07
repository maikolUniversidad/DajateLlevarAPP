import type { PlatformRole } from '@dejatellevar/contracts';
import { type Permission, can, permissionsFor } from '../authz/permissions.js';
import { type DomainError, domainError } from '../errors.js';
import type {
  AuditLogRecorder,
  Clock,
  EventPublisher,
  PlatformStaff,
  PlatformStaffRepository,
} from '../ports.js';
import { type Result, err, ok } from '../result.js';

export interface AssignPlatformRoleDeps {
  staff: PlatformStaffRepository;
  events: EventPublisher;
  audit: AuditLogRecorder;
  clock: Clock;
}

export interface AssignPlatformRoleInput {
  /** Cuenta que ejecuta la acción (debe tener el permiso roles:manage). */
  actorAccountId: string;
  /** Cuenta a la que se le asigna el rol. */
  targetAccountId: string;
  role: PlatformRole;
  extraPermissions?: Permission[];
  /** Prueba para el registro de auditoría. */
  evidence?: { ipAddress?: string | null; userAgent?: string | null };
}

/**
 * AssignPlatformRole — alta o cambio del rol de plataforma de una cuenta.
 *
 * Invariantes:
 *  - Solo quien ya es staff con permiso `roles:manage` (hoy: super_admin) puede
 *    asignar roles. Cualquier otro caso devuelve NOT_AUTHORIZED.
 *  - La asignación es idempotente por cuenta (upsert): reasignar cambia el rol.
 *  - Todo cambio deja rastro en domain_event Y en audit_log.
 */
export async function assignPlatformRole(
  deps: AssignPlatformRoleDeps,
  input: AssignPlatformRoleInput,
): Promise<Result<PlatformStaff, DomainError>> {
  const { staff, events, audit } = deps;

  const actor = await staff.findByAccountId(input.actorAccountId);
  if (!actor) {
    return err(domainError('NOT_AUTHORIZED', 'No eres parte del staff de plataforma'));
  }
  const actorPermissions = permissionsFor(actor.role, actor.extraPermissions);
  if (!can(actorPermissions, 'roles:manage')) {
    return err(domainError('NOT_AUTHORIZED', 'No puedes gestionar roles de plataforma'));
  }

  const extraPermissions = input.extraPermissions ?? [];
  const saved = await staff.upsert({
    accountId: input.targetAccountId,
    role: input.role,
    extraPermissions,
    grantedBy: input.actorAccountId,
  });

  await events.publish({
    eventType: 'platform_staff.role_assigned',
    aggregateType: 'platform_staff',
    aggregateId: input.targetAccountId,
    actorAccountId: input.actorAccountId,
    payload: { role: input.role, extraPermissions },
  });

  await audit.record({
    actorAccountId: input.actorAccountId,
    actorKind: 'user',
    action: 'platform_staff.role_assigned',
    resourceType: 'platform_staff',
    resourceId: input.targetAccountId,
    afterState: { role: input.role, extraPermissions },
    ipAddress: input.evidence?.ipAddress ?? null,
    userAgent: input.evidence?.userAgent ?? null,
  });

  return ok(saved);
}
