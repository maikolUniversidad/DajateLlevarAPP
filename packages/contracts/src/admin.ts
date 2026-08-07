import { z } from 'zod';
import { PaginationSchema } from './common.js';
import { PlatformRole } from './enums.js';

/**
 * Contratos del backoffice de plataforma (consola /admin, §7.6).
 * Fuente de verdad de los permisos granulares: el dominio (packages/core) importa
 * este `Permission` para construir el mapa rol → permisos.
 */

/**
 * Permisos granulares. Derivados de las vistas X01–X15: cada uno habilita ver u
 * operar un área concreta de la consola. Los roles (PlatformRole) son paquetes de
 * estos permisos; `extra_permissions` en platform_staff permite sumar sueltos.
 */
export const Permission = z.enum([
  'dashboard:read', //       X01 salud del marketplace
  'orgs:read', //            X02 organizaciones (lectura)
  'orgs:write', //           X02 verificar, suspender, ajustar comisión
  'accounts:read', //        X03 cuentas (lectura)
  'accounts:write', //       X03 verificación, suspensión
  'services:moderate', //    X04 moderación de servicios
  'reviews:moderate', //     X05 moderación de reseñas
  'disputes:read', //        X06 disputas (lectura)
  'disputes:resolve', //     X06 resolver disputas
  'fraud:read', //           X07 señales de fraude (lectura)
  'fraud:action', //         X07 tomar acción sobre fraude
  'payments:reconcile', //   X08 conciliación de pagos y ledger
  'compliance:read', //      X09 RNT, pólizas, derechos de titulares
  'taxonomy:write', //       X10 categorías y riesgo
  'policies:write', //       X11 versiones de políticas
  'ai:read', //              X12 uso y costo de IA
  'integrations:read', //    X13 clientes de API y MCP
  'events:read', //          X14 explorador de eventos de dominio
  'audit:read', //           X15 registro de auditoría
  'roles:manage', //         asignar/revocar roles de plataforma (solo super_admin)
]);
export type Permission = z.infer<typeof Permission>;

/** Miembro del staff de plataforma. */
export const PlatformStaffSchema = z.object({
  account_id: z.string().uuid(),
  role: PlatformRole,
  /** Permisos adicionales sobre el paquete del rol. */
  extra_permissions: z.array(Permission).default([]),
  granted_by: z.string().uuid().nullable(),
  created_at: z.string().datetime(),
});
export type PlatformStaff = z.infer<typeof PlatformStaffSchema>;

/** Rol y permisos efectivos del staff autenticado (GET /v1/admin/me). */
export const PlatformMeSchema = z.object({
  account_id: z.string().uuid(),
  role: PlatformRole,
  permissions: z.array(Permission),
});
export type PlatformMe = z.infer<typeof PlatformMeSchema>;

/** Asignar (o cambiar) el rol de plataforma de una cuenta (POST /v1/admin/staff). */
export const AssignPlatformRoleSchema = z.object({
  account_id: z.string().uuid(),
  role: PlatformRole,
  extra_permissions: z.array(Permission).optional(),
});
export type AssignPlatformRole = z.infer<typeof AssignPlatformRoleSchema>;

/** Una entrada del registro de auditoría (GET /v1/admin/audit). */
export const AuditLogEntrySchema = z.object({
  id: z.string().uuid(),
  actor_account_id: z.string().uuid().nullable(),
  actor_kind: z.string(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string().uuid().nullable(),
  organization_id: z.string().uuid().nullable(),
  ip_address: z.string().nullable(),
  occurred_at: z.string().datetime(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

/** Filtros del listado de auditoría (reusa la paginación por cursor). */
export const AuditLogQuerySchema = PaginationSchema.extend({
  actor_account_id: z.string().uuid().optional(),
  resource_type: z.string().max(60).optional(),
  action: z.string().max(80).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type AuditLogQuery = z.infer<typeof AuditLogQuerySchema>;

/** Filtros del explorador de eventos de dominio (GET /v1/admin/events). */
export const DomainEventQuerySchema = PaginationSchema.extend({
  event_type: z.string().max(80).optional(),
  aggregate_type: z.string().max(60).optional(),
  aggregate_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
export type DomainEventQuery = z.infer<typeof DomainEventQuerySchema>;
