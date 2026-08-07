'use client';

import { DeptCitySelect } from './DeptCitySelect';

export interface Sede {
  name: string;
  department: string;
  city: string;
  address: string;
}

export function emptySede(): Sede {
  return { name: '', department: '', city: '', address: '' };
}

/**
 * Sedes de la empresa. Opcional: se pueden agregar ahora o más adelante desde
 * el panel. Cada sede usa el selector en cascada departamento → ciudad.
 */
export function SedesInput({
  value,
  onChange,
}: {
  value: Sede[];
  onChange: (value: Sede[]) => void;
}) {
  function update(i: number, patch: Partial<Sede>) {
    onChange(value.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function add() {
    onChange([...value, emptySede()]);
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="font-body text-sm text-text">Sedes (opcional)</p>
        <p className="font-body text-xs text-text-muted">
          Si tienes varios locales, agrégalos ahora o más adelante desde tu panel.
        </p>
      </div>

      {value.map((sede, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: filas editables por índice
          key={i}
          className="flex flex-col gap-3 rounded-lg border border-border bg-surface-raised p-3"
        >
          <div className="flex items-center justify-between">
            <span className="font-body text-sm font-medium text-text">Sede {i + 1}</span>
            <button
              type="button"
              onClick={() => remove(i)}
              className="font-body text-xs text-tinto hover:underline"
            >
              Quitar
            </button>
          </div>
          <input
            value={sede.name}
            onChange={(e) => update(i, { name: e.target.value })}
            placeholder="Nombre de la sede (p. ej. Sede Chapinero)"
            className="h-11 w-full rounded-md border border-border-strong bg-surface px-3 font-body text-text"
          />
          <DeptCitySelect
            department={sede.department}
            city={sede.city}
            onChange={({ department, city }) => update(i, { department, city })}
          />
          <input
            value={sede.address}
            onChange={(e) => update(i, { address: e.target.value })}
            placeholder="Dirección"
            className="h-11 w-full rounded-md border border-border-strong bg-surface px-3 font-body text-text"
          />
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="self-start font-body text-sm font-medium text-violeta hover:underline"
      >
        + Agregar sede
      </button>
    </div>
  );
}
