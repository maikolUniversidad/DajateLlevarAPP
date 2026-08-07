'use client';

import { AdminShell } from '@/components/AdminShell';
import { Button } from '@dejatellevar/ui';
import { useCallback, useEffect, useState } from 'react';

type DomainEvent = {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  actor_account_id: string | null;
  payload: Record<string, unknown>;
  occurred_at: string;
};

const fmt = (iso: string) => new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
const shortId = (id: string | null) => (id ? `${id.slice(0, 8)}…` : '—');

export default function EventosPage() {
  const [events, setEvents] = useState<DomainEvent[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [eventType, setEventType] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (opts: { append: boolean; cursor?: string | null }) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ limit: '25' });
        if (eventType) qs.set('event_type', eventType);
        if (opts.append && opts.cursor) qs.set('cursor', opts.cursor);
        const res = await fetch(`/api/v1/admin/events?${qs.toString()}`);
        if (!res.ok) return;
        const data = (await res.json()) as { data: DomainEvent[]; next_cursor: string | null };
        setEvents((prev) => (opts.append ? [...prev, ...data.data] : data.data));
        setCursor(data.next_cursor);
      } finally {
        setLoading(false);
      }
    },
    [eventType],
  );

  useEffect(() => {
    load({ append: false }).catch(() => {});
  }, [load]);

  return (
    <AdminShell need="events:read">
      {() => (
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-2xl text-text">Eventos de dominio</h1>
          <p className="mt-1 font-body text-text-muted">
            Bitácora append-only de los hechos de negocio de la plataforma.
          </p>

          <form
            className="mt-5 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              load({ append: false }).catch(() => {});
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-text-muted">Tipo de evento</span>
              <input
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="p.ej. booking.completed"
                className="h-10 w-64 rounded-md border border-border-strong bg-surface px-3 font-body text-sm text-text"
              />
            </label>
            <Button type="submit" size="sm" disabled={loading}>
              Filtrar
            </Button>
          </form>

          <div className="mt-5 overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-raised">
                <tr className="font-body text-xs text-text-muted">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Agregado</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Payload</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id} className="border-border border-t bg-surface align-top">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-text-muted">
                      {fmt(ev.occurred_at)}
                    </td>
                    <td className="px-3 py-2 font-body text-sm text-text">{ev.event_type}</td>
                    <td className="px-3 py-2 font-body text-sm text-text">
                      {ev.aggregate_type}
                      <span className="ml-1 font-mono text-xs text-text-muted">
                        {shortId(ev.aggregate_id)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-text-muted">
                      {shortId(ev.actor_account_id)}
                    </td>
                    <td className="px-3 py-2">
                      <details>
                        <summary className="cursor-pointer font-body text-xs text-primary">
                          ver
                        </summary>
                        <pre className="mt-1 max-w-md overflow-x-auto rounded-sm bg-surface-raised p-2 font-mono text-xs text-text-muted">
                          {JSON.stringify(ev.payload, null, 2)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))}
                {events.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center font-body text-sm text-text-muted"
                    >
                      No hay eventos para estos filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center">
            {cursor && (
              <Button
                variant="secondary"
                disabled={loading}
                onClick={() => load({ append: true, cursor })}
              >
                {loading ? 'Cargando...' : 'Cargar más'}
              </Button>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
