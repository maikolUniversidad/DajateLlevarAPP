import { ServiceCard } from '@/components/ServiceCard';
import { apiFetch } from '@/server/api';
import type { Service } from '@dejatellevar/contracts';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type ServiceList = { data: Service[]; next_cursor: string | null };

const CATEGORIES = [
  { slug: 'gastronomia', name: 'Gastronomía' },
  { slug: 'aventura-naturaleza', name: 'Aventura y naturaleza' },
  { slug: 'bienestar', name: 'Bienestar' },
  { slug: 'turismo-llanero', name: 'Turismo llanero' },
  { slug: 'belleza', name: 'Belleza' },
  { slug: 'formacion', name: 'Formación' },
];

async function getTopByFidelity(): Promise<Service[]> {
  try {
    const res = await apiFetch<ServiceList>('/v1/services?sort=fidelity&limit=6');
    return res.data;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const services = await getTopByFidelity();

  return (
    <main>
      {/* HERO — concepto rector: HORIZONTE. Bandas horizontales anchas. */}
      <section className="bg-noche px-6 py-24 text-paja md:px-12">
        <div className="mx-auto max-w-5xl">
          <p className="font-mono text-sm uppercase tracking-widest text-lila">
            Villavicencio · Meta
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight md:text-4xl">
            Sabes qué vas a recibir antes de pagar.
          </h1>
          <p className="mt-4 max-w-2xl font-body text-lg text-paja/80">
            Descubre, reserva y paga servicios del Llano. Cada servicio muestra qué tan fiel es a lo
            que promete — un dato que nadie más te da.
          </p>

          <form action="/buscar" className="mt-8 flex max-w-xl gap-2">
            <input
              name="q"
              placeholder="¿Qué quieres hacer? Mamona, masaje, rafting..."
              className="h-12 flex-1 rounded-md border border-border-strong bg-paja px-4 font-body text-carbon placeholder:text-humo"
              aria-label="Buscar servicios"
            />
            <button
              type="submit"
              className="h-12 rounded-md bg-violeta px-6 font-body font-medium text-white hover:opacity-90"
            >
              Buscar
            </button>
          </form>

          <Link
            href="/descubrir"
            className="mt-4 inline-flex items-center gap-1 font-body text-sm font-medium text-lila hover:underline"
          >
            O explóralo por destino, mapa y swipe →
          </Link>
        </div>
      </section>

      {/* Categorías destacadas */}
      <section className="mx-auto max-w-5xl px-6 py-12 md:px-12">
        <h2 className="font-display text-2xl text-text">Explora por categoría</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/buscar?category=${c.slug}`}
              className="rounded-full border border-border-strong px-4 py-2 font-body text-sm text-text hover:bg-surface-raised"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </section>

      {/* Mejor calificados por fidelidad */}
      <section className="mx-auto max-w-5xl px-6 pb-16 md:px-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl text-text">Mejor calificados por fidelidad</h2>
          <Link
            href="/buscar?sort=fidelity"
            className="font-body text-sm text-violeta hover:underline"
          >
            Ver todos
          </Link>
        </div>

        {services.length === 0 ? (
          <p className="mt-6 rounded-md border border-border bg-surface p-6 font-body text-text-muted">
            Todavía no hay servicios cargados. Corre <code className="font-mono">pnpm db:seed</code>{' '}
            para ver el catálogo de demostración del Meta.
          </p>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        )}
      </section>

      {/* Explicación del eje Expectativa vs Realidad */}
      <section className="bg-surface-raised px-6 py-16 md:px-12">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-2xl text-text">¿Qué es el Índice de Fidelidad?</h2>
          <p className="mt-4 font-body text-text-muted">
            Después de vivir un servicio, quien lo contrató califica de −3 a +3 qué tan fiel fue a
            lo prometido. El promedio es el Índice de Fidelidad: convierte la honestidad en un dato
            que puedes ver antes de reservar.
          </p>
        </div>
      </section>
    </main>
  );
}
