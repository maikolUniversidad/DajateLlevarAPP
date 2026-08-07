'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
}

/**
 * Selector con búsqueda inteligente (combobox accesible, sin dependencias).
 * Filtra por texto; `allowCustom` deja usar un valor escrito que no está en la
 * lista (para categorías libres). `filter` permite búsqueda por sinónimos.
 */
export function Combobox({
  label,
  options,
  value,
  onChange,
  placeholder = 'Escribe para buscar…',
  required,
  disabled,
  allowCustom = false,
  filter,
  emptyText = 'Sin resultados',
}: {
  label?: string;
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  allowCustom?: boolean;
  filter?: (query: string) => ComboOption[];
  emptyText?: string;
}) {
  const id = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? value,
    [options, value],
  );

  // Mantén el texto visible sincronizado con el valor cuando no se está buscando.
  useEffect(() => {
    if (!open) setQuery(selectedLabel);
  }, [open, selectedLabel]);

  const results = useMemo(() => {
    if (filter) return filter(query);
    const q = query.trim().toLowerCase();
    if (!q || q === selectedLabel.toLowerCase()) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.value.includes(q));
  }, [filter, query, options, selectedLabel]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function commit(option: ComboOption) {
    onChange(option.value);
    setQuery(option.label);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = results[active];
      if (opt) commit(opt);
      else if (allowCustom && query.trim()) {
        onChange(query.trim());
        setOpen(false);
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className="flex flex-col gap-1" ref={boxRef}>
      {label && (
        <label htmlFor={id} className="font-body text-sm text-text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          autoComplete="off"
          required={required}
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
            if (allowCustom) onChange(e.target.value);
          }}
          onKeyDown={onKeyDown}
          className="h-11 w-full rounded-md border border-border-strong bg-surface px-3 pr-9 font-body text-text"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
          ▾
        </span>
        {open && (
          <ul className="absolute z-40 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-surface py-1 shadow-modal">
            {results.length === 0 ? (
              <li className="px-3 py-2 font-body text-sm text-text-muted">{emptyText}</li>
            ) : (
              results.map((o, i) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      commit(o);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex w-full flex-col items-start px-3 py-2 text-left font-body text-sm ${
                      i === active ? 'bg-surface-raised' : ''
                    } ${o.value === value ? 'text-violeta' : 'text-text'}`}
                  >
                    <span>{o.label}</span>
                    {o.hint && <span className="text-xs text-text-muted">{o.hint}</span>}
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
