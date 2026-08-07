'use client';

import { DEPARTMENTS, citiesOf } from '@/lib/colombia-geo';
import { Combobox } from './Combobox';

/**
 * Departamento → Ciudad en cascada: al elegir el departamento se habilitan sus
 * ciudades. Ambos con búsqueda inteligente.
 */
export function DeptCitySelect({
  department,
  city,
  onChange,
  deptLabel = 'Departamento',
  cityLabel = 'Ciudad',
}: {
  department: string;
  city: string;
  onChange: (next: { department: string; city: string }) => void;
  deptLabel?: string;
  cityLabel?: string;
}) {
  const deptOptions = DEPARTMENTS.map((d) => ({ value: d, label: d }));
  const cityOptions = citiesOf(department).map((c) => ({ value: c, label: c }));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <Combobox
        label={deptLabel}
        options={deptOptions}
        value={department}
        onChange={(d) => onChange({ department: d, city: '' })}
        placeholder="Busca tu departamento"
      />
      <Combobox
        label={cityLabel}
        options={cityOptions}
        value={city}
        onChange={(c) => onChange({ department, city: c })}
        placeholder={department ? 'Busca tu ciudad' : 'Elige primero el departamento'}
        disabled={!department}
        emptyText="Sin ciudades en la lista"
      />
    </div>
  );
}
