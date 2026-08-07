'use client';

import { ApiRequestError, queryKeys, useApi, useMyCreator } from '@dejatellevar/client';
import { Badge, Button } from '@dejatellevar/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pendiente',
  verified: 'Verificado',
  failed: 'Falló',
};

function fmt(n: number): string {
  return n.toLocaleString('es-CO');
}

export default function PanelCreadorPage() {
  const api = useApi();
  const qc = useQueryClient();
  const { data, isLoading, error } = useMyCreator();

  const analyze = useMutation({
    mutationFn: () => api.analyzeMyContent(),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.myCreator() }),
  });

  if (isLoading) {
    return <Shell>Cargando tu perfil…</Shell>;
  }

  if (error) {
    const notCreator = error instanceof ApiRequestError && error.code === 'CREATOR_NOT_FOUND';
    return (
      <Shell>
        <p className="font-body text-text-muted">
          {notCreator ? 'Todavía no tienes un perfil de creador.' : 'No pudimos cargar tu perfil.'}
        </p>
        {notCreator && (
          <Link href="/creador/registro" className="mt-4 inline-block">
            <Button>Crear perfil de creador</Button>
          </Link>
        )}
      </Shell>
    );
  }

  if (!data) return <Shell>Sin datos.</Shell>;

  const insight = data.insight;

  return (
    <Shell>
      <header className="mb-6">
        <h1 className="font-display text-2xl text-text">@{data.handle}</h1>
        {data.bio && <p className="mt-1 font-body text-text-muted">{data.bio}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {data.categories.map((c) => (
            <Badge key={c}>{c}</Badge>
          ))}
        </div>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 font-display text-lg text-text">Tus redes</h2>
        <ul className="flex flex-col gap-2">
          {data.social_links.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between rounded-md border border-border-strong bg-surface px-3 py-2"
            >
              <span className="font-body text-sm text-text">
                <span className="font-medium capitalize">{l.network}</span>{' '}
                <span className="text-text-muted">· {l.handle ?? l.url}</span>
              </span>
              <Badge>{STATUS_LABEL[l.status] ?? l.status}</Badge>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-text">Análisis de contenido</h2>
          <Button onClick={() => analyze.mutate()} disabled={analyze.isPending}>
            {analyze.isPending
              ? 'Analizando…'
              : insight
                ? 'Volver a analizar'
                : 'Analizar mi contenido'}
          </Button>
        </div>

        {analyze.isError && (
          <p className="mb-3 rounded-md border border-tinto/30 bg-tinto/10 p-3 font-body text-sm text-tinto">
            {analyze.error instanceof ApiRequestError
              ? analyze.error.message
              : 'No pudimos analizar tu contenido.'}
          </p>
        )}

        {!insight ? (
          <p className="font-body text-text-muted">
            Aún no analizamos tu contenido. Al analizarlo, transcribimos tus videos, contamos vistas
            y derivamos tu categoría y audiencia reales.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Piezas analizadas" value={fmt(insight.items_analyzed)} />
              <Stat label="Vistas totales" value={fmt(insight.total_views)} />
              <Stat label="Vistas promedio" value={fmt(Math.round(insight.avg_views))} />
              <Stat
                label="Engagement"
                value={
                  insight.avg_engagement_rate === null
                    ? '—'
                    : `${(insight.avg_engagement_rate * 100).toFixed(1)}%`
                }
              />
            </div>

            <Block title="Categorías sugeridas">
              <div className="flex flex-wrap gap-2">
                {insight.suggested_categories.map((c) => (
                  <Badge key={c}>{c}</Badge>
                ))}
              </div>
            </Block>

            <Block title="Temas frecuentes">
              <div className="flex flex-wrap gap-2">
                {insight.top_topics.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            </Block>

            <Block title="Audiencia estimada">
              <ul className="font-body text-sm text-text-muted">
                <li>Edad principal: {insight.audience.primary_age_range ?? '—'}</li>
                <li>Ciudades: {insight.audience.top_cities.join(', ') || '—'}</li>
                <li>Idiomas: {insight.audience.languages.join(', ') || '—'}</li>
                <li>Intereses: {insight.audience.interests.join(', ') || '—'}</li>
              </ul>
            </Block>

            <Block title="Por red">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse font-body text-sm">
                  <thead>
                    <tr className="text-left text-text-muted">
                      <th className="py-1 pr-4">Red</th>
                      <th className="py-1 pr-4">Seguidores</th>
                      <th className="py-1 pr-4">Vistas prom.</th>
                      <th className="py-1">Piezas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {insight.networks.map((n) => (
                      <tr key={n.network} className="border-t border-border-strong text-text">
                        <td className="py-1 pr-4 capitalize">{n.network}</td>
                        <td className="py-1 pr-4">{fmt(n.followers)}</td>
                        <td className="py-1 pr-4">{fmt(Math.round(n.avg_views))}</td>
                        <td className="py-1">{fmt(n.items)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Block>

            <p className="font-body text-xs text-text-muted">
              Seguridad de marca:{' '}
              <span className="font-medium text-text">{insight.brand_safety}</span>
            </p>
          </div>
        )}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto min-h-screen max-w-2xl px-6 py-12">
      <Link href="/" className="mb-8 inline-block font-display text-xl text-text">
        DéjateLlevar
      </Link>
      <div className="mt-4">{children}</div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border-strong bg-surface p-3">
      <div className="font-display text-xl text-text">{value}</div>
      <div className="font-body text-xs text-text-muted">{label}</div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 font-body text-sm font-medium text-text">{title}</h3>
      {children}
    </div>
  );
}
