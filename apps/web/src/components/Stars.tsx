import { cn } from '@dejatellevar/ui';

/** Estrellas 1..5 de solo lectura. */
export function Stars({
  value,
  className,
}: {
  value: number | null;
  className?: string;
}) {
  const v = Math.round(value ?? 0);
  return (
    <span
      className={cn('inline-flex leading-none', className)}
      aria-label={value !== null ? `${value.toFixed(1)} de 5` : 'sin calificación'}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= v ? 'text-barro' : 'text-niebla'}>
          ★
        </span>
      ))}
    </span>
  );
}
