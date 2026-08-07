import type {
  AvailabilityPort,
  BookingRepository,
  Clock,
  DomainEventInput,
  Service as DomainService,
  EventPublisher,
  Organization,
  OrganizationRepository,
  ServiceRepository,
} from '@dejatellevar/core';
import { and, sql as dsql, eq, isNull } from 'drizzle-orm';
import type { DbClient, Sql } from './client.js';
import * as s from './schema.js';

/** Reloj real. */
export const systemClock: Clock = { now: () => new Date() };

function toMoney(amount: number | null, currency: string) {
  return amount === null ? null : { amount, currency: currency as 'COP' | 'USD' };
}

export function makeServiceRepository(db: DbClient): ServiceRepository {
  return {
    async findById(organizationId, id): Promise<DomainService | null> {
      const rows = await db
        .select()
        .from(s.service)
        .where(
          and(
            eq(s.service.id, id),
            organizationId ? eq(s.service.organizationId, organizationId) : undefined,
            isNull(s.service.deletedAt),
          ),
        )
        .limit(1);
      const r = rows[0];
      if (!r) return null;
      return {
        id: r.id,
        organizationId: r.organizationId,
        slug: r.slug,
        name: r.name,
        modality: r.modality,
        status: r.status,
        basePrice: toMoney(r.basePrice, r.currency),
        minParticipants: r.minParticipants,
        maxParticipants: r.maxParticipants,
        durationMinutes: r.durationMinutes,
        minAdvanceHours: r.minAdvanceHours,
        maxAdvanceDays: r.maxAdvanceDays,
        cancellationPolicy: r.cancellationPolicy,
        riskCategory: r.riskCategory,
        requiresWaiver: r.requiresWaiver,
        minAge: r.minAge,
      };
    },
  };
}

export function makeOrganizationRepository(db: DbClient): OrganizationRepository {
  return {
    async findById(id): Promise<Organization | null> {
      const rows = await db.select().from(s.organization).where(eq(s.organization.id, id)).limit(1);
      const r = rows[0];
      if (!r) return null;
      return {
        id: r.id,
        slug: r.slug,
        legalName: r.legalName,
        tradeName: r.tradeName,
        taxId: r.taxId,
        taxIdVerifiedAt: r.taxIdVerifiedAt,
        tourismRegistry: r.tourismRegistry,
        tourismRegistryValidUntil: r.tourismRegistryValidUntil
          ? new Date(r.tourismRegistryValidUntil)
          : null,
        commissionRate: Number(r.commissionRate),
        isActive: r.isActive,
      };
    },
  };
}

export function makeAvailabilityPort(db: DbClient): AvailabilityPort {
  return {
    async isSlotAvailable({ serviceId, startsAt, endsAt }): Promise<boolean> {
      // Comprueba solapamiento contra reservas activas de los recursos del servicio.
      const rows = await db.execute(dsql`
        SELECT 1
        FROM booking_resource br
        JOIN service_resource sr ON sr.resource_id = br.resource_id
        WHERE sr.service_id = ${serviceId}
          AND br.time_range && tstzrange(${startsAt.toISOString()}, ${endsAt.toISOString()}, '[)')
        LIMIT 1
      `);
      return rows.length === 0;
    },
  };
}

export function makeEventPublisher(db: DbClient): EventPublisher {
  return {
    async publish(event: DomainEventInput): Promise<void> {
      await db.insert(s.domainEvent).values({
        eventType: event.eventType,
        aggregateType: event.aggregateType,
        aggregateId: event.aggregateId,
        organizationId: event.organizationId ?? null,
        actorAccountId: event.actorAccountId ?? null,
        payload: event.payload,
      });
    },
  };
}

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = 'DL-';
  for (let i = 0; i < 6; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/**
 * Repositorio de reservas. Inserta la reserva y reserva sus recursos con el
 * rango tstzrange dentro de una transacción. Si la EXCLUDE USING gist rechaza el
 * solape, Postgres lanza error 23P01 y devolvemos DOUBLE_BOOKING.
 */
export function makeBookingRepository(db: DbClient): BookingRepository {
  return {
    async nextCode() {
      return randomCode();
    },
    async create({ booking, resourceIds }) {
      const code = randomCode();
      try {
        return await db.transaction(async (tx) => {
          const inserted = await tx
            .insert(s.booking)
            .values({
              code,
              organizationId: booking.organizationId,
              serviceId: booking.serviceId,
              clientAccountId: booking.clientAccountId,
              status: booking.status,
              startsAt: booking.startsAt,
              endsAt: booking.endsAt,
              participants: booking.participants,
              unitPrice: booking.unitPrice.amount,
              subtotal: booking.subtotal.amount,
              platformFee: booking.platformFee.amount,
              totalAmount: booking.totalAmount.amount,
              currency: booking.totalAmount.currency,
              waiverSignedAt: booking.waiverSignedAt,
            })
            .returning({ id: s.booking.id, code: s.booking.code });
          const row = inserted[0]!;

          if (booking.startsAt && booking.endsAt) {
            for (const resourceId of resourceIds) {
              await tx.execute(dsql`
                INSERT INTO booking_resource (booking_id, resource_id, time_range)
                VALUES (${row.id}, ${resourceId},
                        tstzrange(${booking.startsAt.toISOString()}, ${booking.endsAt.toISOString()}, '[)'))
              `);
            }
          }

          return {
            ok: true as const,
            booking: { ...booking, id: row.id, code: row.code },
          };
        });
      } catch (e: unknown) {
        const code = (e as { code?: string }).code;
        if (code === '23P01') {
          // exclusion_violation: la exclusión GiST rechazó el solape.
          return { ok: false as const, reason: 'DOUBLE_BOOKING' as const };
        }
        throw e;
      }
    },
  };
}

/** Fija el contexto de RLS para la transacción actual (§5). */
export async function withAccountContext(
  sqlClient: Sql,
  accountId: string,
  fn: () => Promise<void>,
) {
  await sqlClient`SELECT set_config('app.current_account_id', ${accountId}, true)`;
  await fn();
}
