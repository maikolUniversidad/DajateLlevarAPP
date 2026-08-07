'use client';

import { AuthShell, Field, inputClass } from '@/components/AuthShell';
import { Button } from '@dejatellevar/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function RegistroPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    accept_terms: false,
    accept_privacy: false,
    accept_marketing: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { needsVerification: boolean }>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          password: form.password,
          accept_terms: form.accept_terms,
          accept_privacy: form.accept_privacy,
          accept_marketing: form.accept_marketing,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'No pudimos crear tu cuenta');
        return;
      }
      setDone({ needsVerification: !!data.needs_email_verification });
      if (!data.needs_email_verification) {
        router.push('/mi/privacidad');
      }
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  if (done?.needsVerification) {
    return (
      <AuthShell title="Revisa tu correo">
        <p className="font-body text-text-muted">
          Te enviamos un enlace a <strong className="text-text">{form.email}</strong>. Confírmalo
          para activar tu cuenta e iniciar sesión.
        </p>
        <Link
          href="/entrar"
          className="mt-4 inline-block font-body text-sm text-primary hover:underline"
        >
          Ir a iniciar sesión
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Descubre y reserva servicios del Llano.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Nombre completo">
          <input
            required
            value={form.full_name}
            onChange={(e) => set('full_name', e.target.value)}
            className={inputClass}
            autoComplete="name"
          />
        </Field>
        <Field label="Correo">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
        </Field>
        <Field label="Teléfono (opcional)">
          <input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className={inputClass}
            autoComplete="tel"
            inputMode="tel"
          />
        </Field>
        <Field label="Contraseña">
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        </Field>

        <label className="flex items-start gap-2 font-body text-sm text-text">
          <input
            type="checkbox"
            checked={form.accept_terms}
            onChange={(e) => set('accept_terms', e.target.checked)}
            className="mt-1"
          />
          <span>
            Acepto los{' '}
            <Link href="/legal/terminos" className="text-primary hover:underline">
              términos y condiciones
            </Link>
            .
          </span>
        </label>
        <label className="flex items-start gap-2 font-body text-sm text-text">
          <input
            type="checkbox"
            checked={form.accept_privacy}
            onChange={(e) => set('accept_privacy', e.target.checked)}
            className="mt-1"
          />
          <span>
            Autorizo el{' '}
            <Link href="/legal/privacidad" className="text-primary hover:underline">
              tratamiento de mis datos personales
            </Link>{' '}
            (Ley 1581 de 2012).
          </span>
        </label>
        <label className="flex items-start gap-2 font-body text-sm text-text-muted">
          <input
            type="checkbox"
            checked={form.accept_marketing}
            onChange={(e) => set('accept_marketing', e.target.checked)}
            className="mt-1"
          />
          <span>Quiero recibir novedades y ofertas (opcional).</span>
        </label>

        {error && (
          <p className="rounded-md border border-tinto/30 bg-tinto/10 p-3 font-body text-sm text-tinto">
            {error}
          </p>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creando...' : 'Crear cuenta'}
        </Button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-text-muted">
        ¿Ya tienes cuenta?{' '}
        <Link href="/entrar" className="text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
