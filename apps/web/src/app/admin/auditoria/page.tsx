'use client';

import { AdminShell } from '@/components/AdminShell';
import { Button } from '@dejatellevar/ui';
import { useCallback, useEffect, useState } from 'react';

type AuditEntry = {
  id: string;
  actor_account_id: string | null;
  actor_kind: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  ip_address: string | null;
  occurred_at: string;
};

const fmt = (iso: string) => new Date(iso).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
const shortId = (id: string | null) => (id ? `${id.slice(0, 8)}…` : '—');

export default function AuditoriaPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [resourceType, setResourceType] = useState('');
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (opts: { append: boolean; cursor?: string | null }) => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({ limit: '25' });
        if (resourceType) qs.set('resource_type', resourceType);
        if (action) qs.set('action', action);
        if (opts.append && opts.cursor) qs.set('cursor', opts.cursor);
        const res = await fetch(`/api/v1/admin/audit?${qs.toString()}`);
        if (!res.ok) return;
        const data = (await res.json()) as { data: AuditEntry[]; next_cursor: string | null };
        setEntries((prev) => (opts.append ? [...prev, ...data.data] : data.data));
        setCursor(data.next_cursor);
      } finally {
        setLoading(false);
      }
    },
    [resourceType, action],
  );

  useEffect(() => {
    load({ append: false }).catch(() => {});
  }, [load]);

  return (
    <AdminShell need="audit:read">
      {() => (
        <div className="mx-auto max-w-5xl">
          <h1 className="font-display text-2xl text-text">Auditoría</h1>
          <p className="mt-1 font-body text-text-muted">
            Registro inmutable de acciones administrativas y de escritura.
          </p>

          <form
            className="mt-5 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              load({ append: false }).catch(() => {});
            }}
          >
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-text-muted">Tipo de recurso</span>
              <input
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                placeholder="p.ej. platform_staff"
                className="h-10 w-52 rounded-md border border-border-strong bg-surface px-3 font-body text-sm text-text"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-text-muted">Acción</span>
              <input
                value={action}
                onChange={(e) => setAction(e.target.value)}
                placeholder="p.ej. POST /admin/staff"
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
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Acción</th>
                  <th className="px-3 py-2">Recurso</th>
                  <th className="px-3 py-2">IP</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-border border-t bg-surface align-top">
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-text-muted">
                      {fmt(e.occurred_at)}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-text">
                      {shortId(e.actor_account_id)}
                      <span className="ml-1 text-text-muted">({e.actor_kind})</span>
                    </td>
                    <td className="px-3 py-2 font-body text-sm text-text">{e.action}</td>
                    <td className="px-3 py-2 font-body text-sm text-text">
                      {e.resource_type}
                      <span className="ml-1 font-mono text-xs text-text-muted">
                        {shortId(e.resource_id)}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-text-muted">
                      {e.ip_address ?? '—'}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && !loading && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center font-body text-sm text-text-muted"
                    >
                      No hay acciones registradas para estos filtros.
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
