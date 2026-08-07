import { describe, expect, it } from 'vitest';
import type { Booking, Organization, Service } from '../entities.js';
import type {
  AvailabilityPort,
  BookingRepository,
  Clock,
  DomainEventInput,
  EventPublisher,
  OrganizationRepository,
  ServiceRepository,
} from '../ports.js';
import { createBooking } from './create-booking.js';

// --- Fakes: sin red, sin base de datos --------------------------------------

const NOW = new Date('2026-08-06T12:00:00-05:00');
const clock: Clock = { now: () => NOW };

function makeService(over: Partial<Service> = {}): Service {
  return {
    id: 'svc-1',
    organizationId: 'org-1',
    slug: 'amanecer-llanero',
    name: 'Amanecer llanero',
    modality: 'scheduled',
    status: 'published',
    basePrice: { amount: 8500000, currency: 'COP' }, // $ 85.000
    minParticipants: 1,
    maxParticipants: 6,
    durationMinutes: 120,
    minAdvanceHours: 2,
    maxAdvanceDays: 180,
    cancellationPolicy: 'moderate',
    riskCategory: 'none',
    requiresWaiver: false,
    minAge: null,
    ...over,
  };
}

function makeDeps(opts: {
  service: Service | null;
  available?: boolean;
  bookingResult?: { ok: true; booking: Booking } | { ok: false; reason: 'DOUBLE_BOOKING' };
  events?: DomainEventInput[];
}) {
  const services: ServiceRepository = {
    findById: async () => opts.service,
  };
  const organizations: OrganizationRepository = {
    findById: async (): Promise<Organization | null> => null,
  };
  const availability: AvailabilityPort = {
    isSlotAvailable: async () => opts.available ?? true,
  };
  const captured = opts.events ?? [];
  const events: EventPublisher = {
    publish: async (e) => {
      captured.push(e);
    },
  };
  const bookings: BookingRepository = {
    nextCode: async () => 'DL-TEST01',
    create: async ({ booking }) =>
      opts.bookingResult ?? {
        ok: true,
        booking: { ...booking, id: 'bk-1', code: 'DL-TEST01' } as Booking,
      },
  };
  return { services, organizations, availability, bookings, events, clock, captured };
}

const baseInput = {
  organizationId: 'org-1',
  serviceId: 'svc-1',
  clientAccountId: 'acc-1',
  startsAt: new Date('2026-08-10T08:00:00-05:00'),
  participants: 2,
  resourceIds: ['res-1'],
};

describe('createBooking', () => {
  it('crea la reserva y publica booking.created', async () => {
    const deps = makeDeps({ service: makeService() });
    const res = await createBooking(deps, baseInput);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.value.status).toBe('pending_payment');
      expect(res.value.subtotal.amount).toBe(8500000 * 2);
    }
    expect(deps.captured).toHaveLength(1);
    expect(deps.captured[0]?.eventType).toBe('booking.created');
  });

  it('rechaza si el servicio no está publicado', async () => {
    const deps = makeDeps({ service: makeService({ status: 'draft' }) });
    const res = await createBooking(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('SERVICE_NOT_PUBLISHED');
  });

  it('exige exención en categoría de riesgo alto', async () => {
    const deps = makeDeps({
      service: makeService({ riskCategory: 'high', requiresWaiver: true }),
    });
    const res = await createBooking(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('WAIVER_REQUIRED');
  });

  it('acepta riesgo alto con exención firmada', async () => {
    const deps = makeDeps({
      service: makeService({ riskCategory: 'high', requiresWaiver: true }),
    });
    const res = await createBooking(deps, { ...baseInput, waiverSignedAt: NOW });
    expect(res.ok).toBe(true);
  });

  it('rechaza fuera de la ventana de antelación mínima', async () => {
    const deps = makeDeps({ service: makeService({ minAdvanceHours: 48 }) });
    const res = await createBooking(deps, {
      ...baseInput,
      startsAt: new Date('2026-08-06T13:00:00-05:00'), // 1 h después
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('ADVANCE_WINDOW');
  });

  it('rechaza si supera el máximo de participantes', async () => {
    const deps = makeDeps({ service: makeService({ maxParticipants: 2 }) });
    const res = await createBooking(deps, { ...baseInput, participants: 5 });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('INVALID_PARTICIPANTS');
  });

  it('propaga DOUBLE_BOOKING cuando la exclusión de la BD rechaza el rango', async () => {
    const deps = makeDeps({
      service: makeService(),
      bookingResult: { ok: false, reason: 'DOUBLE_BOOKING' },
    });
    const res = await createBooking(deps, baseInput);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error.code).toBe('DOUBLE_BOOKING');
    // No debe publicarse evento si no se creó
    expect(deps.captured).toHaveLength(0);
  });
});
