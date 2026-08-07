import { sql as dsql } from 'drizzle-orm';
import { afterAll, describe, expect, it } from 'vitest';
import { createDbClient } from './client.js';
import { makeBookingRepository } from './repositories.js';
import * as s from './schema.js';

/**
 * Prueba de integración: la restricción de exclusión GiST sobre booking_resource
 * hace IMPOSIBLE reservar el mismo recurso en el mismo horario dos veces, a nivel
 * de base de datos. Se salta si no hay DATABASE_URL (p. ej. en un typecheck local).
 */
const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
const maybe = url ? describe : describe.skip;

maybe('booking_resource — exclusión anti-doble-reserva', () => {
  const { db, sql } = createDbClient(url!, { max: 2 });
  const repo = makeBookingRepository(db);

  afterAll(async () => {
    await sql.end();
  });

  it('rechaza la segunda reserva del mismo recurso en el mismo rango', async () => {
    // Requiere que exista al menos un servicio con un recurso asociado (seed).
    const svc = (await db.select().from(s.service).limit(1))[0];
    if (!svc) return; // sin seed, no hay nada que probar
    const res = (
      await db
        .select()
        .from(s.resource)
        .where(dsql`organization_id = ${svc.organizationId}`)
        .limit(1)
    )[0];
    if (!res) return;

    // Asegura el vínculo service_resource
    await db
      .insert(s.serviceResource)
      .values({ serviceId: svc.id, resourceId: res.id })
      .onConflictDoNothing();

    const startsAt = new Date('2030-01-01T10:00:00-05:00');
    const endsAt = new Date('2030-01-01T12:00:00-05:00');
    const draft = {
      organizationId: svc.organizationId,
      serviceId: svc.id,
      clientAccountId: (await db.select().from(s.account).limit(1))[0]!.id,
      status: 'pending_payment' as const,
      startsAt,
      endsAt,
      participants: 1,
      unitPrice: { amount: 1000, currency: 'COP' as const },
      subtotal: { amount: 1000, currency: 'COP' as const },
      platformFee: { amount: 0, currency: 'COP' as const },
      totalAmount: { amount: 1000, currency: 'COP' as const },
      waiverSignedAt: null,
    };

    const first = await repo.create({ booking: draft, resourceIds: [res.id] });
    expect(first.ok).toBe(true);

    const second = await repo.create({ booking: draft, resourceIds: [res.id] });
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.reason).toBe('DOUBLE_BOOKING');
  });
});
