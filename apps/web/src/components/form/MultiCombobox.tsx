'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

/**
 * Selección múltiple con búsqueda inteligente. Muestra los elegidos como chips
 * removibles; `allowCustom` deja agregar valores propios (Enter). Ideal para
 * categorías de creador.
 */
export function MultiCombobox({
  label,
  options,
  values,
  onChange,
  placeholder = 'Busca y agrega…',
  allowCustom = true,
  max = 10,
  filter,
}: {
  label?: string;
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  allowCustom?: boolean;
  max?: number;
  /** Búsqueda a medida (p. ej. por sinónimos); devuelve las opciones candidatas. */
  filter?: (query: string) => string[];
}) {
  const id = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = filter ? filter(query) : options;
    return base
      .filter((o) => !values.includes(o))
      .filter((o) => (filter || !q ? true : o.toLowerCase().includes(q)))
      .slice(0, 20);
  }, [filter, options, values, query]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function add(value: string) {
    const v = value.trim();
    if (!v || values.includes(v) || values.length >= max) return;
    onChange([...values, v]);
    setQuery('');
  }

  function remove(value: string) {
    onChange(values.filter((v) => v !== value));
  }

  return (
    <div className="flex flex-col gap-1" ref={boxRef}>
      {label && (
        <span className="font-body text-sm text-text-muted">
          {label}{' '}
          <span className="text-text-muted/70">
            ({values.length}/{max})
          </span>
        </span>
      )}
      <div className="rounded-md border border-border-strong bg-surface px-2 py-2">
        {values.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {values.map((v) => (
              <span
                key={v}
                className="inline-flex items-center gap-1 rounded-full bg-violeta/15 px-2.5 py-1 font-body text-xs text-violeta"
              >
                {v}
                <button
                  type="button"
                  aria-label={`Quitar ${v}`}
                  onClick={() => remove(v)}
                  className="text-violeta/70 hover:text-violeta"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="relative">
          <input
            id={id}
            autoComplete="off"
            value={query}
            placeholder={values.length >= max ? 'Máximo alcanzado' : placeholder}
            disabled={values.length >= max}
            onFocus={() => setOpen(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (results[0]) add(results[0]);
                else if (allowCustom) add(query);
              } else if (e.key === 'Backspace' && !query && values.length) {
                remove(values[values.length - 1] as string);
              }
            }}
            className="h-9 w-full bg-transparent px-1 font-body text-sm text-text outline-none"
          />
          {open && (query || results.length > 0) && (
            <ul className="absolute z-40 mt-1 max-h-56 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-modal">
              {results.map((o) => (
                <li key={o}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(o);
                    }}
                    className="w-full px-3 py-2 text-left font-body text-sm text-text hover:bg-surface-raised"
                  >
                    {o}
                  </button>
                </li>
              ))}
              {allowCustom && query.trim() && !options.includes(query.trim()) && (
                <li>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      add(query);
                    }}
                    className="w-full px-3 py-2 text-left font-body text-sm text-violeta hover:bg-surface-raised"
                  >
                    Agregar “{query.trim()}”
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
