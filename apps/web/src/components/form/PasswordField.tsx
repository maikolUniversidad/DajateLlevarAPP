'use client';

import { useId, useMemo, useState } from 'react';

const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGIT = '23456789';
const SYMBOL = '!@#$%&*?-_';

function randInt(max: number): number {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] as number) % max;
}

function pick(chars: string): string {
  return chars[randInt(chars.length)] as string;
}

/** Genera una contraseña segura de 16 caracteres con al menos uno de cada tipo. */
function generatePassword(): string {
  const all = LOWER + UPPER + DIGIT + SYMBOL;
  const base = [pick(LOWER), pick(UPPER), pick(DIGIT), pick(SYMBOL)];
  while (base.length < 16) base.push(pick(all));
  // Barajado Fisher-Yates con aleatoriedad criptográfica.
  for (let i = base.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [base[i], base[j]] = [base[j] as string, base[i] as string];
  }
  return base.join('');
}

/** Puntúa 0..4 según longitud y variedad de caracteres. */
export function scorePassword(pw: string): number {
  if (!pw) return 0;
  let variety = 0;
  if (/[a-z]/.test(pw)) variety++;
  if (/[A-Z]/.test(pw)) variety++;
  if (/\d/.test(pw)) variety++;
  if (/[^a-zA-Z0-9]/.test(pw)) variety++;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (variety >= 3) score++;
  if (variety === 4 && pw.length >= 10) score++;
  return Math.min(4, score);
}

const LEVELS = [
  { label: '', color: 'transparent' },
  { label: 'Muy débil', color: 'var(--tinto)' },
  { label: 'Débil', color: 'var(--barro)' },
  { label: 'Aceptable', color: 'var(--maiz, #b5651d)' },
  { label: 'Fuerte', color: 'var(--brote)' },
];

export function PasswordField({
  label = 'Contraseña',
  value,
  onChange,
  required,
  minLength = 8,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  const id = useId();
  const [show, setShow] = useState(false);
  const score = useMemo(() => scorePassword(value), [value]);
  const level = LEVELS[score] ?? LEVELS[0];

  function useGenerated() {
    const pw = generatePassword();
    onChange(pw);
    setShow(true);
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="font-body text-sm text-text-muted">
          {label}
        </label>
        <button
          type="button"
          onClick={useGenerated}
          className="font-body text-xs font-medium text-violeta hover:underline"
        >
          Generar clave segura
        </button>
      </div>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          required={required}
          minLength={minLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="new-password"
          className="h-11 w-full rounded-md border border-border-strong bg-surface px-3 pr-16 font-body text-text"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 font-body text-xs text-text-muted hover:text-text"
        >
          {show ? 'Ocultar' : 'Ver'}
        </button>
      </div>

      {/* Medidor de seguridad */}
      <div className="mt-1 flex gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full"
            style={{ backgroundColor: i <= score ? level?.color : 'var(--niebla)' }}
          />
        ))}
      </div>
      <p className="font-body text-xs text-text-muted" aria-live="polite">
        {value
          ? `Seguridad: ${level?.label}`
          : 'Usa 12+ caracteres, con mayúsculas, números y símbolos.'}
      </p>
    </div>
  );
}
