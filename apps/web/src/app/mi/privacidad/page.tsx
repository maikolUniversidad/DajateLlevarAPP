'use client';

import { AuthShell } from '@/components/AuthShell';
import { Badge, Button } from '@dejatellevar/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

type Consent = {
  purpose: string;
  granted: boolean;
  granted_at: string | null;
  policy_version: string;
};

const PURPOSE_LABEL: Record<string, string> = {
  terms: 'Términos y condiciones',
  privacy: 'Tratamiento de datos personales',
  marketing: 'Comunicaciones de marketing',
  sensitive_accessibility: 'Datos de accesibilidad (sensibles)',
  ai_processing: 'Procesamiento con IA',
  data_sharing: 'Compartir datos con terceros',
};

export default function PrivacidadPage() {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'unauth' | 'ready'>('loading');
  const [consents, setConsents] = useState<Consent[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const me = await fetch('/api/v1/me');
    if (me.status === 401) {
      setState('unauth');
      return;
    }
    const c = await fetch('/api/v1/me/consents');
    const data = await c.json();
    setConsents(data.data ?? []);
    setState('ready');
  }, []);

  useEffect(() => {
    load().catch(() => setState('unauth'));
  }, [load]);

  async function toggleMarketing(granted: boolean) {
    setBusy(true);
    setMsg(null);
    try {
      await fetch('/api/v1/me/consents', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ purpose: 'marketing', granted }),
      });
      await load();
      setMsg(granted ? 'Activaste las comunicaciones de marketing.' : 'Desactivaste el marketing.');
    } finally {
      setBusy(false);
    }
  }

  async function requestData(kind: 'export' | 'delete') {
    if (
      kind === 'delete' &&
      !confirm(
        '¿Eliminar tu cuenta y solicitar la supresión de tus datos? Esta acción cierra tu sesión.',
      )
    ) {
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await fetch('/api/v1/me/data-requests', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      if (kind === 'delete') {
        await fetch('/api/v1/auth/logout', { method: 'POST' });
        router.push('/');
        return;
      }
      setMsg('Registramos tu solicitud de exportación. Te contactaremos con el archivo.');
    } finally {
      setBusy(false);
    }
  }

  if (state === 'loading') {
    return (
      <AuthShell title="Privacidad y datos">
        <p className="font-body text-text-muted">Cargando...</p>
      </AuthShell>
    );
  }

  if (state === 'unauth') {
    return (
      <AuthShell title="Privacidad y datos" subtitle="Inicia sesión para gestionar tus datos.">
        <Link href="/entrar">
          <Button className="w-full">Iniciar sesión</Button>
        </Link>
      </AuthShell>
    );
  }

  const marketing = consents.find((c) => c.purpose === 'marketing');

  return (
    <AuthShell
      title="Privacidad y datos"
      subtitle="Tus consentimientos y derechos (Ley 1581 de 2012)."
    >
      <section className="flex flex-col gap-3">
        <h2 className="font-display text-lg text-text">Consentimientos otorgados</h2>
        {consents.length === 0 && (
          <p className="font-body text-sm text-text-muted">
            Aún no hay consentimientos registrados.
          </p>
        )}
        {consents.map((c) => (
          <div
            key={c.purpose}
            className="flex items-center justify-between rounded-md border border-border bg-surface p-3"
          >
            <div>
              <p className="font-body text-sm text-text">{PURPOSE_LABEL[c.purpose] ?? c.purpose}</p>
              <p className="font-mono text-xs text-text-muted">
                v{c.policy_version}
                {c.granted_at ? ` · ${new Date(c.granted_at).toLocaleDateString('es-CO')}` : ''}
              </p>
            </div>
            <Badge tone={c.granted ? 'success' : 'neutral'}>
              {c.granted ? 'Otorgado' : 'No otorgado'}
            </Badge>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-md border border-border bg-surface p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-sm text-text">Comunicaciones de marketing</p>
            <p className="font-body text-xs text-text-muted">Puedes cambiarlo cuando quieras.</p>
          </div>
          <Button
            variant={marketing?.granted ? 'secondary' : 'primary'}
            size="sm"
            disabled={busy}
            onClick={() => toggleMarketing(!marketing?.granted)}
          >
            {marketing?.granted ? 'Desactivar' : 'Activar'}
          </Button>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-lg text-text">Tus derechos</h2>
        <p className="mb-3 font-body text-sm text-text-muted">
          Puedes solicitar una copia de tus datos o su eliminación.
        </p>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={busy} onClick={() => requestData('export')}>
            Exportar mis datos
          </Button>
          <Button variant="destructive" disabled={busy} onClick={() => requestData('delete')}>
            Eliminar mi cuenta
          </Button>
        </div>
      </section>

      {msg && (
        <p className="mt-4 rounded-md border border-brote/30 bg-brote/10 p-3 font-body text-sm text-brote">
          {msg}
        </p>
      )}

      <div className="mt-8">
        <button
          type="button"
          className="font-body text-sm text-primary hover:underline"
          onClick={async () => {
            await fetch('/api/v1/auth/logout', { method: 'POST' });
            router.push('/');
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </AuthShell>
  );
}
