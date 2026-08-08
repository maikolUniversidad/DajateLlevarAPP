'use client';

import { ServiceCard } from '@/components/ServiceCard';
import { useCategories, useServices } from '@dejatellevar/client';
import type { Service, ServiceSearch } from '@dejatellevar/contracts';
import { MoneyDisplay } from '@dejatellevar/ui';
import Link from 'next/link';
import { type ReactNode, useMemo, useState } from 'react';

type Vista = 'lista' | 'mapa' | 'swipe';

const DESTINOS = [
  { slug: 'villavicencio', label: 'Villavicencio', city: 'Villavicencio' },
  { slug: 'restrepo', label: 'Restrepo', city: 'Restrepo' },
  { slug: 'acacias', label: 'Acacías', city: 'Acacías' },
  { slug: 'cumaral', label: 'Cumaral', city: 'Cumaral' },
  { slug: 'puerto-lopez', label: 'Puerto López', city: 'Puerto López' },
  { slug: 'granada', label: 'Granada', city: 'Granada' },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-4 py-1.5 font-body text-sm transition-colors ${
        active ? 'bg-violeta text-white' : 'bg-surface text-text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}

export default function DescubrirPage() {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [destino, setDestino] = useState<string | null>(null);
  const [actividad, setActividad] = useState<string | null>(null);
  const [vista, setVista] = useState<Vista>('lista');
  const [guardados, setGuardados] = useState<Set<string>>(new Set());

  const categoriesQ = useCategories();
  const ciudad = DESTINOS.find((d) => d.slug === destino)?.city;

  const params = useMemo<Partial<ServiceSearch>>(
    () => ({
      sort: 'fidelity',
      ...(submitted ? { q: submitted } : {}),
      ...(ciudad ? { city: ciudad } : {}),
      ...(actividad ? { category: actividad } : {}),
    }),
    [submitted, ciudad, actividad],
  );
  const servicesQ = useServices(params);
  const services = servicesQ.data?.data ?? [];

  const actividades = (categoriesQ.data?.data ?? []).filter((c) => c.parent_id === null);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10 md:px-12">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="font-body text-sm text-violeta hover:underline">
          ← Inicio
        </Link>
        <span className="font-body text-sm text-text-muted">♥ {guardados.size} guardados</span>
      </div>

      <h1 className="mb-4 font-display text-3xl text-text">Descubre</h1>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && setSubmitted(query.trim())}
        placeholder="Mamona, rafting, masaje…"
        className="mb-4 h-11 w-full rounded-md border border-border-strong bg-surface px-4 font-body text-text"
      />

      <p className="mb-1 font-mono text-xs uppercase tracking-wide text-text-muted">Destino</p>
      <div className="mb-3 flex gap-2 overflow-x-auto pb-1">
        <Chip active={destino === null} onClick={() => setDestino(null)}>
          Todo el Meta
        </Chip>
        {DESTINOS.map((d) => (
          <Chip key={d.slug} active={destino === d.slug} onClick={() => setDestino(d.slug)}>
            {d.label}
          </Chip>
        ))}
      </div>

      <p className="mb-1 font-mono text-xs uppercase tracking-wide text-text-muted">Actividad</p>
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <Chip active={actividad === null} onClick={() => setActividad(null)}>
          Todas
        </Chip>
        {actividades.map((c) => (
          <Chip key={c.slug} active={actividad === c.slug} onClick={() => setActividad(c.slug)}>
            {c.name}
          </Chip>
        ))}
      </div>

      <div className="mb-8 inline-flex rounded-full bg-niebla p-1">
        {(['lista', 'mapa', 'swipe'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setVista(v)}
            className={`rounded-full px-5 py-1.5 font-body text-sm capitalize transition-colors ${
              vista === v ? 'bg-violeta text-white' : 'text-text-muted'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {servicesQ.isLoading ? (
        <p className="font-body text-text-muted">Cargando…</p>
      ) : servicesQ.isError ? (
        <p className="rounded-md border border-tinto/30 bg-tinto/10 p-6 font-body text-tinto">
          No pudimos cargar el catálogo.
        </p>
      ) : services.length === 0 ? (
        <p className="rounded-md border border-border bg-surface p-6 font-body text-text-muted">
          No hay servicios con estos filtros. Prueba otro destino o actividad.
        </p>
      ) : vista === 'lista' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      ) : vista === 'mapa' ? (
        <MapStub services={services} />
      ) : (
        <SwipeView services={services} onLike={(id) => setGuardados((p) => new Set(p).add(id))} />
      )}
    </main>
  );
}

function MapStub({ services }: { services: Service[] }) {
  const withCoords = services.filter((s) => s.latitude !== null && s.longitude !== null);
  return (
    <div className="rounded-md border border-dashed border-border-strong bg-surface p-8 font-body">
      <p className="mb-2 font-display text-xl text-text">Vista de mapa</p>
      <p className="text-sm text-text-muted">
        El mapa interactivo llega con la integración de tiles. {withCoords.length} de{' '}
        {services.length} servicios ya traen coordenadas listas para ubicarse.
      </p>
    </div>
  );
}

function SwipeView({
  services,
  onLike,
}: {
  services: Service[];
  onLike: (id: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const s = services[index];
  if (!s) {
    return (
      <div className="rounded-md border border-border bg-surface p-8 text-center font-body text-text-muted">
        No quedan más por aquí. Cambia de destino o actividad.
      </div>
    );
  }
  const advance = () => setIndex((i) => i + 1);
  return (
    <div className="mx-auto max-w-md">
      <Link
        href={`/servicio/${s.id}`}
        className="block rounded-lg border border-border bg-noche p-8 text-paja"
      >
        <p className="font-display text-3xl">{s.name}</p>
        {s.city ? <p className="mt-1 font-body text-lila">{s.city}</p> : null}
        <div className="mt-4">
          {s.base_price ? (
            <MoneyDisplay value={s.base_price} />
          ) : (
            <span className="font-body text-sm text-niebla">Por cotización</span>
          )}
        </div>
      </Link>
      <div className="mt-4 flex justify-center gap-6">
        <button
          type="button"
          onClick={advance}
          className="h-14 w-14 rounded-full border border-border bg-surface text-2xl text-tinto"
          aria-label="Paso"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={() => {
            onLike(s.id);
            advance();
          }}
          className="h-14 w-14 rounded-full border border-border bg-surface text-2xl text-brote"
          aria-label="Me gusta, guardar"
        >
          ♥
        </button>
      </div>
    </div>
  );
}
