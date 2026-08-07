'use client';

import { AuthShell, Field, inputClass } from '@/components/AuthShell';
import { Button } from '@dejatellevar/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function EntrarPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'No pudimos iniciar sesión');
        return;
      }
      router.push('/mi/privacidad');
      router.refresh();
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Inicia sesión" subtitle="Bienvenido de vuelta.">
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label="Correo">
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
          />
        </Field>
        <Field label="Contraseña">
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            autoComplete="current-password"
          />
        </Field>

        {error && (
          <p className="rounded-md border border-tinto/30 bg-tinto/10 p-3 font-body text-sm text-tinto">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Link href="/recuperar" className="font-body text-sm text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </Button>
      </form>

      <p className="mt-6 text-center font-body text-sm text-text-muted">
        ¿No tienes cuenta?{' '}
        <Link href="/registro" className="text-primary hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthShell>
  );
}
