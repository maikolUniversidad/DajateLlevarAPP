'use client';

/**
 * Selección de opciones como chips (para conjuntos pequeños y fijos: rangos de
 * edad, formatos). Sin búsqueda, a diferencia de MultiCombobox.
 */
export function ChipMultiSelect({
  label,
  options,
  values,
  onChange,
}: {
  label?: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
}) {
  function toggle(o: string) {
    onChange(values.includes(o) ? values.filter((v) => v !== o) : [...values, o]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="font-body text-sm text-text-muted">{label}</span>}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(o)}
              className={`rounded-full border px-3 py-1.5 font-body text-sm transition-colors ${
                on
                  ? 'border-violeta bg-violeta text-white'
                  : 'border-border-strong bg-surface text-text hover:border-violeta'
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
