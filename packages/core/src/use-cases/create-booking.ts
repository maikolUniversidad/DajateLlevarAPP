import type { Money } from '@dejatellevar/contracts';
import type { Booking } from '../entities.js';
import { type DomainError, domainError } from '../errors.js';
import type {
  AvailabilityPort,
  BookingRepository,
  Clock,
  EventPublisher,
  OrganizationRepository,
  ServiceRepository,
} from '../ports.js';
import { type Result, err, ok } from '../result.js';

export interface CreateBookingInput {
  organizationId: string;
  serviceId: string;
  clientAccountId: string;
  startsAt: Date;
  participants: number;
  /** Recursos que consume el servicio (personas, salas, vehículos). */
  resourceIds: string[];
  /** Firma de exención, obligatoria en categorías de riesgo alto. */
  waiverSignedAt?: Date | null;
  /** Edad del cliente, para validar min_age si aplica. */
  clientAge?: number | null;
}

export interface CreateBookingDeps {
  services: ServiceRepository;
  organizations: OrganizationRepository;
  availability: AvailabilityPort;
  bookings: BookingRepository;
  events: EventPublisher;
  clock: Clock;
}

/**
 * CreateBooking — caso de uso completo con las invariantes de negocio:
 *   1. El servicio existe y está publicado.
 *   2. Participantes dentro de [min, max].
 *   3. Ventana de antelación: min_advance_hours ≤ Δ ≤ max_advance_days.
 *   4. Edad mínima si el servicio la exige.
 *   5. Exención firmada si risk_category = 'high' o requires_waiver.
 *   6. Slot disponible (defensa de aplicación) + exclusión GiST (defensa de BD).
 *   7. Ningún cambio de estado sin escribir domain_event (regla #5).
 */
export async function createBooking(
  deps: CreateBookingDeps,
  input: CreateBookingInput,
): Promise<Result<Booking, DomainError>> {
  const { services, availability, bookings, events, clock } = deps;
  const now = clock.now();

  const service = await services.findById(input.organizationId, input.serviceId);
  if (!service) {
    return err(domainError('SERVICE_NOT_FOUND', 'El servicio no existe'));
  }
  if (service.status !== 'published') {
    return err(domainError('SERVICE_NOT_PUBLISHED', 'El servicio no está publicado'));
  }

  // 2. Participantes
  if (input.participants < service.minParticipants) {
    return err(
      domainError('INVALID_PARTICIPANTS', `El mínimo es ${service.minParticipants} participantes`),
    );
  }
  if (service.maxParticipants !== null && input.participants > service.maxParticipants) {
    return err(
      domainError('INVALID_PARTICIPANTS', `El máximo es ${service.maxParticipants} participantes`),
    );
  }

  // 3. Ventana de antelación
  const hoursAhead = (input.startsAt.getTime() - now.getTime()) / 3_600_000;
  if (hoursAhead < service.minAdvanceHours) {
    return err(
      domainError(
        'ADVANCE_WINDOW',
        `Debes reservar con al menos ${service.minAdvanceHours} h de antelación`,
      ),
    );
  }
  if (hoursAhead / 24 > service.maxAdvanceDays) {
    return err(
      domainError(
        'ADVANCE_WINDOW',
        `No puedes reservar con más de ${service.maxAdvanceDays} días de antelación`,
      ),
    );
  }

  // 4. Edad mínima
  if (service.minAge !== null && (input.clientAge ?? 0) < service.minAge) {
    return err(domainError('INVALID_PARTICIPANTS', `Edad mínima: ${service.minAge} años`));
  }

  // 5. Exención en categorías de riesgo
  const needsWaiver = service.requiresWaiver || service.riskCategory === 'high';
  if (needsWaiver && !input.waiverSignedAt) {
    return err(
      domainError(
        'WAIVER_REQUIRED',
        'Esta actividad de riesgo requiere firmar la exención de responsabilidad',
      ),
    );
  }

  // 6. Cálculo económico (dinero en centavos)
  const durationMin = service.durationMinutes ?? 60;
  const endsAt = new Date(input.startsAt.getTime() + durationMin * 60_000);
  if (!service.basePrice) {
    return err(
      domainError('PRICING_INVALID', 'El servicio no tiene precio para reservar en línea'),
    );
  }
  const unitPrice = service.basePrice;
  const subtotalAmount = unitPrice.amount * input.participants;
  const platformFeeAmount = 0; // la comisión se asienta en el ledger al pagar
  const subtotal: Money = { amount: subtotalAmount, currency: unitPrice.currency };
  const total: Money = { amount: subtotalAmount + platformFeeAmount, currency: unitPrice.currency };

  // 6b. Disponibilidad (defensa de aplicación)
  const available = await availability.isSlotAvailable({
    serviceId: service.id,
    startsAt: input.startsAt,
    endsAt,
    participants: input.participants,
  });
  if (!available) {
    return err(domainError('RESOURCE_UNAVAILABLE', 'No hay disponibilidad en ese horario'));
  }

  // 6c. Persistencia atómica con exclusión GiST (defensa de base de datos)
  const draft: Omit<Booking, 'id' | 'code'> = {
    organizationId: service.organizationId,
    serviceId: service.id,
    clientAccountId: input.clientAccountId,
    status: 'pending_payment',
    startsAt: input.startsAt,
    endsAt,
    participants: input.participants,
    unitPrice,
    subtotal,
    platformFee: { amount: platformFeeAmount, currency: unitPrice.currency },
    totalAmount: total,
    waiverSignedAt: input.waiverSignedAt ?? null,
  };

  const created = await bookings.create({ booking: draft, resourceIds: input.resourceIds });
  if (!created.ok) {
    return err(domainError('DOUBLE_BOOKING', 'Ese recurso ya está reservado en ese horario'));
  }

  // 7. Evento de dominio (regla #5)
  await events.publish({
    eventType: 'booking.created',
    aggregateType: 'booking',
    aggregateId: created.booking.id,
    organizationId: service.organizationId,
    actorAccountId: input.clientAccountId,
    payload: {
      code: created.booking.code,
      serviceId: service.id,
      participants: input.participants,
      total: total.amount,
      currency: total.currency,
    },
  });

  return ok(created.booking);
}
