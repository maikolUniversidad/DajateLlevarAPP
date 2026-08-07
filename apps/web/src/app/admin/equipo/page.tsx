'use client';

import { AdminShell, type PlatformMe, ROLE_LABEL } from '@/components/AdminShell';
import { Badge, Button } from '@dejatellevar/ui';
import { useCallback, useEffect, useState } from 'react';

type StaffRow = {
  account_id: string;
  role: PlatformMe['role'];
  permissions: string[];
  granted_by: string | null;
  created_at: string;
};

const ROLES: PlatformMe['role'][] = ['super_admin', 'moderator', 'finance', 'support', 'analyst'];
const shortId = (id: string | null) => (id ? `${id.slice(0, 8)}…` : '—');

export default function EquipoPage() {
  const [rows, setRows] = useState<StaffRow[]>([]);
  const [accountId, setAccountId] = useState('');
  const [role, setRole] = useState<PlatformMe['role']>('support');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch('/api/v1/admin/staff');
    if (!res.ok) return;
    const data = (await res.json()) as { data: StaffRow[] };
    setRows(data.data);
  }, []);

  useEffect(() => {
    load().catch(() => {});
  }, [load]);

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/v1/admin/staff', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ account_id: accountId.trim(), role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ tone: 'error', text: data?.error?.message ?? 'No se pudo asignar el rol' });
        return;
      }
      setMsg({ tone: 'ok', text: `Rol ${ROLE_LABEL[role]} asignado.` });
      setAccountId('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id: string) {
    if (!confirm('¿Revocar el rol de plataforma de esta cuenta?')) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/v1/admin/staff/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg({ tone: 'error', text: data?.error?.message ?? 'No se pudo revocar' });
        return;
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell need="roles:manage">
      {(me) => (
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-2xl text-text">Equipo y roles</h1>
          <p className="mt-1 font-body text-text-muted">
            Asigna roles de plataforma. Cada cambio queda registrado en la auditoría.
          </p>

          <form
            onSubmit={assign}
            className="mt-5 flex flex-wrap items-end gap-3 rounded-md border border-border bg-surface p-4"
          >
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-text-muted">ID de cuenta (UUID)</span>
              <input
                required
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="h-10 w-80 rounded-md border border-border-strong bg-surface px-3 font-mono text-xs text-text"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-text-muted">Rol</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as PlatformMe['role'])}
                className="h-10 rounded-md border border-border-strong bg-surface px-3 font-body text-sm text-text"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABEL[r]}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit" size="sm" disabled={busy}>
              Asignar rol
            </Button>
          </form>

          {msg && (
            <p
              className={`mt-3 rounded-md border p-3 font-body text-sm ${
                msg.tone === 'ok'
                  ? 'border-brote/30 bg-brote/10 text-brote'
                  : 'border-tinto/30 bg-tinto/10 text-tinto'
              }`}
            >
              {msg.text}
            </p>
          )}

          <div className="mt-6 overflow-x-auto rounded-md border border-border">
            <table className="w-full border-collapse text-left">
              <thead className="bg-surface-raised">
                <tr className="font-body text-xs text-text-muted">
                  <th className="px-3 py-2">Cuenta</th>
                  <th className="px-3 py-2">Rol</th>
                  <th className="px-3 py-2">Permisos</th>
                  <th className="px-3 py-2">Desde</th>
                  <th className="px-3 py-2 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.account_id} className="border-border border-t bg-surface align-top">
                    <td className="px-3 py-2 font-mono text-xs text-text">
                      {shortId(r.account_id)}
                    </td>
                    <td className="px-3 py-2">
                      <Badge tone="info">{ROLE_LABEL[r.role]}</Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-text-muted">
                      {r.permissions.length} permisos
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-text-muted">
                      {new Date(r.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.account_id === me.account_id ? (
                        <span className="font-body text-xs text-text-muted">tú</span>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={busy}
                          onClick={() => revoke(r.account_id)}
                          className="text-tinto"
                        >
                          Revocar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center font-body text-sm text-text-muted"
                    >
                      Aún no hay miembros del staff de plataforma.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
