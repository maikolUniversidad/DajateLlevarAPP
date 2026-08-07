import './load-env.js';
import { sql as dsql } from 'drizzle-orm';
import { createDbClient } from './client.js';
import * as s from './schema.js';

/**
 * Datos semilla del Meta (§6). Deja el entorno listo para desarrollar.
 * Termina verificando que TODO transaction_id del ledger cuadre (débitos =
 * créditos). Si no cuadra, falla ruidosamente.
 */

const CATEGORIES: { slug: string; name: string; risk: 'none' | 'moderate' | 'high' }[] = [
  { slug: 'gastronomia', name: 'Gastronomía', risk: 'none' },
  { slug: 'aventura-naturaleza', name: 'Aventura y naturaleza', risk: 'high' },
  { slug: 'bienestar', name: 'Bienestar', risk: 'none' },
  { slug: 'belleza', name: 'Belleza', risk: 'none' },
  { slug: 'deporte-fitness', name: 'Deporte y fitness', risk: 'moderate' },
  { slug: 'cultura-entretenimiento', name: 'Cultura y entretenimiento', risk: 'none' },
  { slug: 'turismo-llanero', name: 'Turismo llanero', risk: 'moderate' },
  { slug: 'formacion', name: 'Formación', risk: 'none' },
  { slug: 'servicios-profesionales', name: 'Servicios profesionales', risk: 'none' },
  { slug: 'eventos', name: 'Eventos', risk: 'none' },
  { slug: 'hogar-mascotas', name: 'Hogar y mascotas', risk: 'none' },
  { slug: 'transporte-traslados', name: 'Transporte y traslados', risk: 'high' },
];

async function main() {
  const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL para el seed.');
  const { db, sql } = createDbClient(url, { max: 1 });

  try {
    console.log('Sembrando categorías...');
    const cats = await db
      .insert(s.category)
      .values(
        CATEGORIES.map((c, i) => ({
          slug: c.slug,
          nameEs: c.name,
          riskCategory: c.risk,
          sortOrder: i,
        })),
      )
      .returning({ id: s.category.id, slug: s.category.slug });
    const catBySlug = new Map(cats.map((c) => [c.slug, c.id]));

    console.log('Sembrando cuentas...');
    const accounts = await db
      .insert(s.account)
      .values([
        {
          email: 'admin@dejatellevar.com',
          fullName: 'Administración DéjateLlevar',
          emailVerifiedAt: new Date(),
        },
        {
          email: 'lucia.moreno@example.co',
          fullName: 'Lucía Moreno',
          city: 'Villavicencio',
          department: 'Meta',
          emailVerifiedAt: new Date(),
        },
        {
          email: 'carlos.parrado@example.co',
          fullName: 'Carlos Parrado',
          city: 'Acacías',
          department: 'Meta',
          emailVerifiedAt: new Date(),
        },
        {
          email: 'daniela.rincon@example.co',
          fullName: 'Daniela Rincón',
          city: 'Villavicencio',
          department: 'Meta',
          emailVerifiedAt: new Date(),
        },
        {
          email: 'hato.laesperanza@example.co',
          fullName: 'Hernando Gaitán',
          city: 'Puerto López',
          department: 'Meta',
          emailVerifiedAt: new Date(),
        },
      ])
      .returning({ id: s.account.id, email: s.account.email });
    const clientId = accounts[1]!.id;

    console.log('Sembrando organizaciones...');
    const orgs = await db
      .insert(s.organization)
      .values([
        {
          slug: 'sabor-llanero',
          legalName: 'Sabor Llanero S.A.S.',
          tradeName: 'Sabor Llanero',
          taxId: '901234567-1',
          taxIdVerifiedAt: new Date(),
          email: 'hola@saborllanero.co',
          phone: '+573101112233',
          city: 'Villavicencio',
          department: 'Meta',
          latitude: '4.142000',
          longitude: '-73.626500',
          commissionRate: '0.1200',
          promiseFidelity: '0.40',
        },
        {
          slug: 'ariari-aventura',
          legalName: 'Ariari Aventura S.A.S.',
          tradeName: 'Ariari Aventura',
          taxId: '901234567-2',
          taxIdVerifiedAt: new Date(),
          tourismRegistry: 'RNT-45231',
          tourismRegistryValidUntil: '2027-06-30',
          email: 'reservas@ariariaventura.co',
          phone: '+573104445566',
          city: 'Granada',
          department: 'Meta',
          latitude: '3.546000',
          longitude: '-73.708000',
          commissionRate: '0.1500',
          promiseFidelity: '-0.80',
        },
        {
          slug: 'spa-manantial',
          legalName: 'Manantial Urbano S.A.S.',
          tradeName: 'Spa Manantial',
          taxId: '901234567-3',
          taxIdVerifiedAt: new Date(),
          email: 'citas@spamanantial.co',
          phone: '+573107778899',
          city: 'Villavicencio',
          department: 'Meta',
          latitude: '4.135500',
          longitude: '-73.635000',
          commissionRate: '0.1200',
          promiseFidelity: '1.10',
        },
        {
          slug: 'escuela-coleo',
          legalName: 'Escuela de Coleo del Meta S.A.S.',
          tradeName: 'Escuela de Coleo',
          taxId: '901234567-4',
          taxIdVerifiedAt: new Date(),
          email: 'info@escuelacoleo.co',
          phone: '+573102223344',
          city: 'Restrepo',
          department: 'Meta',
          latitude: '4.259000',
          longitude: '-73.565000',
          commissionRate: '0.1000',
          promiseFidelity: '0.20',
        },
      ])
      .returning({ id: s.organization.id, slug: s.organization.slug });
    const orgBySlug = new Map(orgs.map((o) => [o.slug, o.id]));

    console.log('Sembrando servicios...');
    const serviceRows = [
      {
        org: 'sabor-llanero',
        cat: 'gastronomia',
        slug: 'mamona-a-la-llanera',
        name: 'Mamona a la llanera para dos',
        short: 'Ternera asada al estilo llanero, con guarniciones típicas.',
        modality: 'scheduled' as const,
        price: 12000000,
        risk: 'none' as const,
        duration: 120,
        max: 2,
        fidelity: '0.60',
        rating: '4.70',
        reviews: 24,
      },
      {
        org: 'sabor-llanero',
        cat: 'gastronomia',
        slug: 'clase-de-cocina-llanera',
        name: 'Clase de cocina llanera',
        short: 'Aprende a preparar hayacas y pan de arroz.',
        modality: 'capacity' as const,
        price: 9500000,
        risk: 'none' as const,
        duration: 180,
        max: 10,
        fidelity: '0.30',
        rating: '4.50',
        reviews: 12,
      },
      {
        org: 'ariari-aventura',
        cat: 'aventura-naturaleza',
        slug: 'rafting-rio-guejar',
        name: 'Rafting en el río Güejar',
        short: 'Descenso guiado con equipo certificado y póliza.',
        modality: 'scheduled' as const,
        price: 18000000,
        risk: 'high' as const,
        duration: 240,
        max: 8,
        waiver: true,
        minAge: 12,
        fidelity: '-1.20',
        rating: '4.10',
        reviews: 31,
      },
      {
        org: 'ariari-aventura',
        cat: 'turismo-llanero',
        slug: 'amanecer-llanero',
        name: 'Amanecer llanero a caballo',
        short: 'Cabalgata al amanecer por la sabana con desayuno.',
        modality: 'scheduled' as const,
        price: 8500000,
        risk: 'moderate' as const,
        duration: 180,
        max: 6,
        waiver: true,
        fidelity: '0.90',
        rating: '4.80',
        reviews: 18,
      },
      {
        org: 'spa-manantial',
        cat: 'bienestar',
        slug: 'masaje-relajante-90',
        name: 'Masaje relajante de 90 minutos',
        short: 'Terapia de relajación profunda con aceites esenciales.',
        modality: 'scheduled' as const,
        price: 15000000,
        risk: 'none' as const,
        duration: 90,
        max: 1,
        fidelity: '1.30',
        rating: '4.90',
        reviews: 40,
      },
      {
        org: 'spa-manantial',
        cat: 'bienestar',
        slug: 'ritual-de-pareja',
        name: 'Ritual de pareja',
        short: 'Circuito de aguas y masaje para dos personas.',
        modality: 'scheduled' as const,
        price: 28000000,
        risk: 'none' as const,
        duration: 150,
        max: 2,
        fidelity: '1.00',
        rating: '4.75',
        reviews: 9,
      },
      {
        org: 'escuela-coleo',
        cat: 'formacion',
        slug: 'curso-basico-coleo',
        name: 'Curso básico de coleo',
        short: 'Introducción a la tradición llanera del coleo.',
        modality: 'capacity' as const,
        price: 6000000,
        risk: 'moderate' as const,
        duration: 120,
        max: 12,
        waiver: true,
        minAge: 15,
        fidelity: null,
        rating: null,
        reviews: 3,
      },
      {
        org: 'escuela-coleo',
        cat: 'cultura-entretenimiento',
        slug: 'show-coleo-tradicional',
        name: 'Show de coleo tradicional',
        short: 'Espectáculo con jinetes y música llanera en vivo.',
        modality: 'capacity' as const,
        price: 4500000,
        risk: 'none' as const,
        duration: 90,
        max: 40,
        fidelity: '0.10',
        rating: '4.30',
        reviews: 15,
      },
    ];

    const services = await db
      .insert(s.service)
      .values(
        serviceRows.map((r) => ({
          organizationId: orgBySlug.get(r.org)!,
          slug: r.slug,
          name: r.name,
          shortDescription: r.short,
          description: `${r.name}. Experiencia ofrecida en el departamento del Meta. ${r.short}`,
          categoryId: catBySlug.get(r.cat)!,
          modality: r.modality,
          status: 'published' as const,
          pricingMode: 'fixed' as const,
          basePrice: r.price,
          durationMinutes: r.duration,
          minParticipants: 1,
          maxParticipants: r.max,
          riskCategory: r.risk,
          requiresWaiver: r.waiver ?? false,
          minAge: r.minAge ?? null,
          city: 'Villavicencio',
          department: 'Meta',
          accessibility: { mobility: 'partial', hearing: 'no', children: r.minAge ? 'no' : 'yes' },
          expectationFidelity: r.fidelity,
          avgRating: r.rating,
          reviewCount: r.reviews,
          publishedAt: new Date(),
        })),
      )
      .returning({
        id: s.service.id,
        slug: s.service.slug,
        org: s.service.organizationId,
        price: s.service.basePrice,
      });

    console.log('Sembrando recursos...');
    for (const o of orgs) {
      await db.insert(s.resource).values([
        { organizationId: o.id, name: 'Guía principal', kind: 'staff', capacity: 1 },
        { organizationId: o.id, name: 'Sala / espacio 1', kind: 'room', capacity: 20 },
      ]);
    }

    console.log('Sembrando reservas, pagos y ledger cuadrado...');
    const completed = services.slice(0, 5);
    let txCount = 0;
    for (const [i, svc] of completed.entries()) {
      const total = (svc.price ?? 5000000) as number;
      const bk = await db
        .insert(s.booking)
        .values({
          code: `DL-${String(1000 + i)}`,
          organizationId: svc.org,
          serviceId: svc.id,
          clientAccountId: clientId,
          status: 'completed',
          startsAt: new Date(Date.now() - (i + 3) * 86400000),
          endsAt: new Date(Date.now() - (i + 3) * 86400000 + 7200000),
          participants: 1,
          unitPrice: total,
          subtotal: total,
          totalAmount: total,
          completedAt: new Date(Date.now() - (i + 3) * 86400000 + 7200000),
        })
        .returning({ id: s.booking.id });
      const bookingId = bk[0]!.id;

      const pay = await db
        .insert(s.payment)
        .values({
          bookingId,
          organizationId: svc.org,
          payerAccountId: clientId,
          status: 'released',
          method: 'card',
          amount: total,
          provider: 'wompi',
          providerTransactionId: `test-${i}`,
          heldAt: new Date(),
          releasedAt: new Date(),
        })
        .returning({ id: s.payment.id });
      const paymentId = pay[0]!.id;

      // Transacción de liquidación de DOBLE ENTRADA (débitos == créditos).
      const commission = Math.round(total * 0.12);
      const vat = Math.round(commission * 0.19);
      const providerPayable = total - commission;
      const txId = crypto.randomUUID();
      txCount++;
      await db.insert(s.ledgerEntry).values([
        {
          transactionId: txId,
          accountType: 'escrow_held',
          side: 'debit',
          amount: total,
          organizationId: svc.org,
          bookingId,
          paymentId,
          description: 'Liberación de escrow de la reserva',
        },
        {
          transactionId: txId,
          accountType: 'provider_payable',
          side: 'credit',
          amount: providerPayable,
          organizationId: svc.org,
          bookingId,
          paymentId,
          description: 'Pago al prestador',
        },
        {
          transactionId: txId,
          accountType: 'platform_revenue',
          side: 'credit',
          amount: commission - vat,
          organizationId: svc.org,
          bookingId,
          paymentId,
          taxKind: 'commission',
          description: 'Comisión de la plataforma (neta de IVA)',
        },
        {
          transactionId: txId,
          accountType: 'vat_payable',
          side: 'credit',
          amount: vat,
          organizationId: svc.org,
          bookingId,
          paymentId,
          taxKind: 'vat',
          taxRate: '0.1900',
          description: 'IVA sobre la comisión',
        },
      ]);

      await db.insert(s.domainEvent).values({
        eventType: 'booking.completed',
        aggregateType: 'booking',
        aggregateId: bookingId,
        organizationId: svc.org,
        actorAccountId: clientId,
        payload: { code: `DL-${String(1000 + i)}`, total },
      });

      // Reseña con los cinco ejes (incluye fidelidad negativa y positiva).
      const rv = await db
        .insert(s.review)
        .values({
          bookingId,
          serviceId: svc.id,
          organizationId: svc.org,
          authorAccountId: clientId,
          comment: 'Experiencia registrada por el sistema de datos semilla.',
        })
        .returning({ id: s.review.id });
      const reviewId = rv[0]!.id;
      const evr = i % 2 === 0 ? '1.0' : '-1.5';
      await db.insert(s.reviewAxis).values([
        { reviewId, kind: 'expectation_vs_reality', value: evr },
        { reviewId, kind: 'service_quality', value: '4.5' },
        { reviewId, kind: 'punctuality', value: '4.0' },
        { reviewId, kind: 'accessibility', value: '3.5' },
        { reviewId, kind: 'value_for_money', value: '4.0' },
      ]);
    }

    // --- Verificación de cuadre del ledger (requisito de §6) -----------------
    console.log('Verificando cuadre del ledger...');
    const unbalanced = await sql<{ transaction_id: string; debit: number; credit: number }[]>`
      SELECT transaction_id,
             SUM(amount) FILTER (WHERE side = 'debit')  AS debit,
             SUM(amount) FILTER (WHERE side = 'credit') AS credit
      FROM ledger_entry
      GROUP BY transaction_id
      HAVING COALESCE(SUM(amount) FILTER (WHERE side = 'debit'), 0)
           <> COALESCE(SUM(amount) FILTER (WHERE side = 'credit'), 0)
    `;

    if (unbalanced.length > 0) {
      console.error('LEDGER DESCUADRADO en transacciones:', unbalanced);
      throw new Error(`El ledger no cuadra en ${unbalanced.length} transacción(es).`);
    }

    console.log(
      `\n✓ Seed completo. ${cats.length} categorías, ${orgs.length} organizaciones, ` +
        `${services.length} servicios, ${completed.length} reservas, ${txCount} transacciones de ledger cuadradas.`,
    );
  } finally {
    await sql.end();
  }
}

main().catch((e) => {
  console.error('\nError en el seed:', e);
  process.exit(1);
});
