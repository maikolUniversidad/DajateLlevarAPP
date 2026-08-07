'use client';

import { AuthShell } from '@/components/AuthShell';
import { ChipMultiSelect } from '@/components/form/ChipMultiSelect';
import { MultiCombobox } from '@/components/form/MultiCombobox';
import { COLOMBIA } from '@/lib/colombia-geo';
import type { Category, ClientPreferences, PriceBand } from '@dejatellevar/contracts';
import { Button } from '@dejatellevar/ui';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';

// Etiqueta ↔ valor para los conjuntos fijos (el chip muestra la etiqueta, se guarda el valor).
const BUDGETS: { value: PriceBand; label: string }[] = [
  { value: 'economico', label: 'Económico' },
  { value: 'moderado', label: 'Moderado' },
  { value: 'premium', label: 'Premium' },
  { value: 'flexible', label: 'Sin preferencia' },
];
const COMPANY: { value: string; label: string }[] = [
  { value: 'solo', label: 'Solo/a' },
  { value: 'pareja', label: 'En pareja' },
  { value: 'familia', label: 'En familia' },
  { value: 'amigos', label: 'Con amigos' },
];
const OCCASIONS: { value: string; label: string }[] = [
  { value: 'relax', label: 'Relax' },
  { value: 'aventura', label: 'Aventura' },
  { value: 'celebracion', label: 'Celebración' },
  { value: 'gastronomia', label: 'Gastronomía' },
  { value: 'aprendizaje', label: 'Aprender algo' },
  { value: 'cultura', label: 'Cultura' },
];

function labelsToValues(labels: string[], map: { value: string; label: string }[]): string[] {
  return labels.map((l) => map.find((m) => m.label === l)?.value).filter((v): v is string => !!v);
}
function valuesToLabels(values: string[], map: { value: string; label: string }[]): string[] {
  return values.map((v) => map.find((m) => m.value === v)?.label).filter((l): l is string => !!l);
}

function GustosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('bienvenida') === '1';

  const [categories, setCategories] = useState<Category[]>([]);
  const [interests, setInterests] = useState<string[]>([]); // slugs
  const [budget, setBudget] = useState<PriceBand>('flexible');
  const [cities, setCities] = useState<string[]>([]);
  const [company, setCompany] = useState<string[]>([]); // values
  const [occasions, setOccasions] = useState<string[]>([]); // values

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allCities = useMemo(
    () => Array.from(new Set(COLOMBIA.flatMap((d) => d.cities))).sort((a, b) => a.localeCompare(b)),
    [],
  );
  // name_es ↔ slug para las categorías (el chip muestra el nombre, se guarda el slug).
  const catByName = useMemo(
    () => new Map(categories.map((c) => [c.name_es, c.slug])),
    [categories],
  );
  const catBySlug = useMemo(
    () => new Map(categories.map((c) => [c.slug, c.name_es])),
    [categories],
  );
  const interestLabels = interests.map((s) => catBySlug.get(s)).filter((n): n is string => !!n);

  useEffect(() => {
    (async () => {
      try {
        const [catsRes, prefsRes] = await Promise.all([
          fetch('/api/v1/categories'),
          fetch('/api/v1/me/preferences'),
        ]);
        if (prefsRes.status === 401) {
          router.replace('/entrar');
          return;
        }
        if (catsRes.ok) {
          const cats = (await catsRes.json()) as { data: Category[] };
          setCategories(cats.data);
        }
        if (prefsRes.ok) {
          const p = (await prefsRes.json()) as ClientPreferences;
          setInterests(p.interests);
          setBudget(p.budget);
          setCities(p.cities);
          setCompany(p.company);
          setOccasions(p.occasions);
        }
      } catch {
        setError('No pudimos cargar tus preferencias. Intenta recargar.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function onSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/me/preferences', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ interests, budget, cities, company, occasions }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          router.replace('/entrar');
          return;
        }
        setError('No pudimos guardar tus gustos. Intenta de nuevo.');
        return;
      }
      // Personalización: llevamos al cliente a una búsqueda "Para ti" pre-llenada
      // con su primer interés y su primera ciudad.
      const qs = new URLSearchParams();
      if (interests[0]) qs.set('category', interests[0]);
      if (cities[0]) qs.set('city', cities[0]);
      router.push(`/buscar${qs.toString() ? `?${qs.toString()}` : ''}`);
    } catch {
      setError('Error de red. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  }

  const title = isWelcome ? '¡Bienvenido/a! Cuéntanos tus gustos' : 'Tus gustos';
  const subtitle =
    'Con esto la plataforma te muestra primero lo que te llama la atención. Puedes cambiarlo cuando quieras.';

  return (
    <AuthShell title={title} subtitle={subtitle}>
      {loading ? (
        <p className="font-body text-text-muted">Cargando…</p>
      ) : (
        <div className="flex flex-col gap-6">
          <section>
            <p className="mb-2 font-body text-sm font-semibold text-text">
              ¿Qué te llama la atención?
            </p>
            {categories.length > 0 ? (
              <ChipMultiSelect
                options={categories.map((c) => c.name_es)}
                values={interestLabels}
                onChange={(labels) =>
                  setInterests(labels.map((l) => catByName.get(l)).filter((s): s is string => !!s))
                }
              />
            ) : (
              <p className="font-body text-sm text-text-muted">No pudimos cargar las categorías.</p>
            )}
          </section>

          <section>
            <p className="mb-2 font-body text-sm font-semibold text-text">¿Cuánto sueles gastar?</p>
            <div className="flex flex-wrap gap-2">
              {BUDGETS.map((b) => {
                const on = budget === b.value;
                return (
                  <button
                    key={b.value}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setBudget(b.value)}
                    className={`rounded-full border px-3 py-1.5 font-body text-sm transition-colors ${
                      on
                        ? 'border-violeta bg-violeta text-white'
                        : 'border-border-strong bg-surface text-text hover:border-violeta'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>
          </section>

          <MultiCombobox
            label="¿En qué ciudades sueles buscar?"
            options={allCities}
            values={cities}
            onChange={setCities}
            allowCustom={false}
            max={20}
            placeholder="Busca tus ciudades"
          />

          <ChipMultiSelect
            label="¿Con quién disfrutas los planes?"
            options={COMPANY.map((c) => c.label)}
            values={valuesToLabels(company, COMPANY)}
            onChange={(labels) => setCompany(labelsToValues(labels, COMPANY))}
          />

          <ChipMultiSelect
            label="¿Qué buscas normalmente?"
            options={OCCASIONS.map((o) => o.label)}
            values={valuesToLabels(occasions, OCCASIONS)}
            onChange={(labels) => setOccasions(labelsToValues(labels, OCCASIONS))}
          />

          {error && (
            <p className="rounded-md border border-tinto/30 bg-tinto/10 p-3 font-body text-sm text-tinto">
              {error}
            </p>
          )}

          <div className="flex items-center gap-4">
            <Button type="button" onClick={onSave} disabled={saving} className="flex-1">
              {saving ? 'Guardando…' : 'Guardar y ver recomendaciones'}
            </Button>
            <Link href="/buscar" className="font-body text-sm text-text-muted hover:underline">
              Saltar por ahora
            </Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}

export default function GustosPage() {
  return (
    <Suspense
      fallback={
        <AuthShell title="Tus gustos" subtitle="Cargando…">
          {null}
        </AuthShell>
      }
    >
      <GustosContent />
    </Suspense>
  );
}
