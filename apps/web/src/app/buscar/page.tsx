import { ServiceCard } from '@/components/ServiceCard';
import { apiFetch } from '@/server/api';
import type { Service } from '@dejatellevar/contracts';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type ServiceList = { data: Service[]; next_cursor: string | null };

const SORTS = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'fidelity', label: 'Fidelidad' },
  { value: 'rating', label: 'Calificación' },
  { value: 'price_asc', label: 'Precio ↑' },
  { value: 'price_desc', label: 'Precio ↓' },
  { value: 'newest', label: 'Recientes' },
];

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const key of ['q', 'category', 'city', 'price_min', 'price_max', 'fidelity_min', 'sort']) {
    const v = sp[key];
    if (v) params.set(key, v);
  }

  let result: ServiceList = { data: [], next_cursor: null };
  let failed = false;
  try {
    result = await apiFetch<ServiceList>(`/v1/services?${params.toString()}`);
  } catch {
    failed = true;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 md:px-12">
      <div className="mb-6">
        <Link href="/" className="font-body text-sm text-rio hover:underline">
          ← Inicio
        </Link>
      </div>

      {/* Filtros */}
      <form className="mb-8 flex flex-wrap items-end gap-3 rounded-md border border-border bg-surface p-4">
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-text-muted">Buscar</span>
          <input
            name="q"
            defaultValue={sp.q ?? ''}
            placeholder="Palabra clave"
            className="h-10 rounded-md border border-border-strong bg-surface px-3 font-body text-text"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-text-muted">Ciudad</span>
          <input
            name="city"
            defaultValue={sp.city ?? ''}
            placeholder="Villavicencio"
            className="h-10 rounded-md border border-border-strong bg-surface px-3 font-body text-text"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-body text-xs text-text-muted">Ordenar</span>
          <select
            name="sort"
            defaultValue={sp.sort ?? 'relevance'}
            className="h-10 rounded-md border border-border-strong bg-surface px-3 font-body text-text"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {sp.category && <input type="hidden" name="category" value={sp.category} />}
        <button
          type="submit"
          className="h-10 rounded-md bg-rio px-5 font-body font-medium text-white hover:opacity-90"
        >
          Aplicar
        </button>
      </form>

      <h1 className="mb-4 font-display text-2xl text-text">
        {result.data.length} resultado{result.data.length === 1 ? '' : 's'}
        {sp.q ? ` para "${sp.q}"` : ''}
      </h1>

      {failed ? (
        <p className="rounded-md border border-tinto/30 bg-tinto/10 p-6 font-body text-tinto">
          No pudimos consultar el catálogo. ¿Está la base de datos migrada y sembrada?
        </p>
      ) : result.data.length === 0 ? (
        <p className="rounded-md border border-border bg-surface p-6 font-body text-text-muted">
          No encontramos servicios con esos filtros. Prueba ampliar la búsqueda.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {result.data.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </main>
  );
}
