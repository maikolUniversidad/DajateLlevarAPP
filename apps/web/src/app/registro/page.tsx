'use client';

import { AuthShell, Field, inputClass } from '@/components/AuthShell';
import { ChipMultiSelect } from '@/components/form/ChipMultiSelect';
import { Combobox } from '@/components/form/Combobox';
import { DeptCitySelect } from '@/components/form/DeptCitySelect';
import { MultiCombobox } from '@/components/form/MultiCombobox';
import { PasswordField } from '@/components/form/PasswordField';
import { type Sede, SedesInput } from '@/components/form/SedesInput';
import {
  type SocialLinkRow,
  SocialLinksInput,
  emptySocialLink,
} from '@/components/form/SocialLinksInput';
import { SECTORS, searchSectors } from '@/lib/business-sectors';
import { COLOMBIA } from '@/lib/colombia-geo';
import {
  AGE_RANGES,
  AUDIENCE_GENDERS,
  AUDIENCE_SCOPES,
  CONTENT_CATEGORIES,
  CONTENT_FORMATS,
  CONTENT_STYLE_LABELS,
  searchContentStyles,
} from '@/lib/creator-options';
import { detectNetwork } from '@/lib/social-networks';
import { Button } from '@dejatellevar/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type UserType = 'client' | 'business' | 'creator';

const TYPES: { value: UserType; label: string; hint: string }[] = [
  { value: 'client', label: 'Cliente', hint: 'Descubre y reserva experiencias en toda Colombia.' },
  {
    value: 'business',
    label: 'Empresa',
    hint: 'Publica y opera tu negocio, y contrata creadores.',
  },
  { value: 'creator', label: 'Creador', hint: 'Monetiza tu audiencia con marcas del país.' },
];

const SECTOR_LABELS = SECTORS.map((s) => s.label);

export default function RegistroPage() {
  const router = useRouter();
  const [type, setType] = useState<UserType>('client');

  // Cuenta (todos los tipos)
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Empresa
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [tourismRegistry, setTourismRegistry] = useState('');
  const [bizEmail, setBizEmail] = useState('');
  const [bizPhone, setBizPhone] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [customSector, setCustomSector] = useState('');
  const [bizGeo, setBizGeo] = useState({ department: '', city: '' });
  const [sedes, setSedes] = useState<Sede[]>([]);

  // Creador
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [creatorCities, setCreatorCities] = useState<string[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLinkRow[]>([emptySocialLink()]);
  // Audiencia y estilo (para el matching con marcas)
  const [creatorTypes, setCreatorTypes] = useState<string[]>([]);
  const [formats, setFormats] = useState<string[]>([]);
  const [audienceAges, setAudienceAges] = useState<string[]>([]);
  const [audienceGender, setAudienceGender] = useState('');
  const [audienceInterests, setAudienceInterests] = useState<string[]>([]);
  const [audienceScope, setAudienceScope] = useState('');

  // Consentimientos
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<null | { needsVerification: boolean }>(null);

  const allCities = useMemo(
    () => Array.from(new Set(COLOMBIA.flatMap((d) => d.cities))).sort((a, b) => a.localeCompare(b)),
    [],
  );

  useEffect(() => {
    const rol = new URLSearchParams(window.location.search).get('rol');
    if (rol === 'business' || rol === 'creator' || rol === 'client') setType(rol);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validaciones específicas por tipo (antes de tocar la red).
    if (type === 'creator') {
      const valid = socialLinks.filter((r) => detectNetwork(r.url));
      if (valid.length === 0) {
        setError('Agrega al menos un enlace válido de una red social para ser creador.');
        return;
      }
      if (categories.length === 0) {
        setError('Elige al menos una categoría de contenido.');
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: fullName,
        email,
        phone: phone || undefined,
        password,
        accept_terms: acceptTerms,
        accept_privacy: acceptPrivacy,
        accept_marketing: acceptMarketing,
        profile_type: type,
      };

      if (type === 'business') {
        const sectorValues = sectors.map(
          (label) => SECTORS.find((s) => s.label === label)?.value ?? label,
        );
        payload.business = {
          legal_name: legalName,
          trade_name: tradeName,
          tax_id: taxId,
          tourism_registry: tourismRegistry || undefined,
          email: bizEmail || undefined,
          phone: bizPhone,
          city: bizGeo.city,
          department: bizGeo.department,
          sector: sectorValues[0] ?? (customSector || undefined),
          sectors: sectorValues,
          custom_sector: customSector || undefined,
          // Solo enviamos sedes completas (nombre + ciudad + departamento); las
          // filas a medio llenar se ignoran y se pueden completar luego en el panel.
          sedes: sedes.filter((s) => s.name && s.city && s.department),
        };
      }

      if (type === 'creator') {
        payload.creator = {
          handle,
          bio: bio || undefined,
          categories,
          cities: creatorCities,
          social_links: socialLinks
            .map((r) => ({ url: r.url.trim(), network: r.network || detectNetwork(r.url) }))
            .filter((l) => l.network),
          creator_type: creatorTypes[0] ?? undefined,
          creator_types: creatorTypes,
          formats,
          audience: {
            age_ranges: audienceAges,
            gender: audienceGender || undefined,
            interests: audienceInterests,
            scope: audienceScope || undefined,
          },
        };
      }

      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error?.message ?? 'No pudimos crear tu cuenta');
        return;
      }
      setDone({ needsVerification: !!data.needs_email_verification });
      if (!data.needs_email_verification) {
        // El cliente pasa al test de gustos (onboarding); el resto, a su cuenta.
        router.push(type === 'client' ? '/mi/gustos?bienvenida=1' : '/mi/privacidad');
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
          Te enviamos un enlace a <strong className="text-text">{email}</strong>. Confírmalo para
          activar tu cuenta e iniciar sesión.
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

  const activeHint = TYPES.find((t) => t.value === type)?.hint;

  return (
    <AuthShell title="Crea tu cuenta" subtitle="Elige tu tipo de cuenta: las preguntas cambian.">
      {/* Selector de tipo de usuario */}
      <div className="mb-2 grid grid-cols-3 gap-2" role="tablist" aria-label="Tipo de cuenta">
        {TYPES.map((t) => {
          const active = t.value === type;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setType(t.value)}
              className={`rounded-md border px-3 py-2 font-body text-sm transition-colors ${
                active
                  ? 'border-violeta bg-violeta text-white'
                  : 'border-border-strong bg-surface text-text hover:border-violeta'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
      {activeHint && <p className="mb-5 font-body text-sm text-text-muted">{activeHint}</p>}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {/* --- Datos de la cuenta (todos los tipos) --- */}
        <Field label={type === 'business' ? 'Tu nombre completo' : 'Nombre completo'}>
          <input
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            autoComplete="name"
          />
        </Field>
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
        <Field label="Teléfono (opcional)">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
            autoComplete="tel"
            inputMode="tel"
          />
        </Field>
        <PasswordField value={password} onChange={setPassword} required />

        {/* --- Preguntas de EMPRESA --- */}
        {type === 'business' && (
          <>
            <div className="mt-2 border-t border-border pt-4">
              <p className="font-display text-lg text-text">Datos de tu negocio</p>
            </div>
            <Field label="Razón social">
              <input
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Nombre comercial">
              <input
                required
                value={tradeName}
                onChange={(e) => setTradeName(e.target.value)}
                className={inputClass}
              />
            </Field>
            <MultiCombobox
              label="Gremio / sector (elige uno o varios)"
              options={SECTOR_LABELS}
              values={sectors}
              onChange={setSectors}
              allowCustom={false}
              filter={(q) => searchSectors(q).map((s) => s.label)}
              placeholder="Busca tu gremio (p. ej. restaurante, hotel, spa…)"
            />
            <Field label="Otro gremio (opcional)">
              <input
                value={customSector}
                onChange={(e) => setCustomSector(e.target.value)}
                className={inputClass}
                placeholder="Si no está en la lista, escríbelo aquí"
              />
            </Field>
            <Field label="NIT">
              <input
                required
                value={taxId}
                onChange={(e) => setTaxId(e.target.value)}
                className={inputClass}
                inputMode="numeric"
              />
            </Field>
            <Field label="Registro Nacional de Turismo (opcional)">
              <input
                value={tourismRegistry}
                onChange={(e) => setTourismRegistry(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Correo de la empresa (opcional)">
              <input
                type="email"
                value={bizEmail}
                onChange={(e) => setBizEmail(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Teléfono de la empresa">
              <input
                required
                value={bizPhone}
                onChange={(e) => setBizPhone(e.target.value)}
                className={inputClass}
                inputMode="tel"
              />
            </Field>
            <DeptCitySelect
              department={bizGeo.department}
              city={bizGeo.city}
              onChange={setBizGeo}
            />
            <div className="mt-2 border-t border-border pt-4">
              <SedesInput value={sedes} onChange={setSedes} />
            </div>
          </>
        )}

        {/* --- Preguntas de CREADOR --- */}
        {type === 'creator' && (
          <>
            <div className="mt-2 border-t border-border pt-4">
              <p className="font-display text-lg text-text">Tu perfil de creador</p>
              <p className="mt-1 font-body text-sm text-text-muted">
                Tus métricas de audiencia y fidelidad se calculan, no se declaran.
              </p>
            </div>
            <Field label="Usuario (@)">
              <input
                required
                value={handle}
                onChange={(e) => setHandle(e.target.value.toLowerCase())}
                className={inputClass}
                placeholder="tuusuario"
                autoCapitalize="none"
              />
            </Field>
            <SocialLinksInput value={socialLinks} onChange={setSocialLinks} />
            <MultiCombobox
              label="Categorías de contenido"
              options={CONTENT_CATEGORIES}
              values={categories}
              onChange={setCategories}
              placeholder="Busca o agrega tus categorías"
            />
            <MultiCombobox
              label="Ciudades donde creas contenido (opcional)"
              options={allCities}
              values={creatorCities}
              onChange={setCreatorCities}
              allowCustom={false}
              max={30}
              placeholder="Busca entre todas las ciudades del país"
            />
            <Field label="Bio (opcional)">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className={`${inputClass} h-24 py-2`}
                maxLength={500}
              />
            </Field>

            <div className="mt-2 border-t border-border pt-4">
              <p className="font-display text-lg text-text">Tu audiencia y estilo</p>
              <p className="mt-1 font-body text-sm text-text-muted">
                Ayuda a las marcas a encontrarte y decidir a quién pautar o contratar.
              </p>
            </div>
            <MultiCombobox
              label="¿Cómo describes tu contenido? (elige uno o varios)"
              options={CONTENT_STYLE_LABELS}
              values={creatorTypes}
              onChange={setCreatorTypes}
              filter={searchContentStyles}
              max={12}
              placeholder="Busca (tutoriales, reseñas, humor, vlogs…) o agrega el tuyo"
            />
            <ChipMultiSelect
              label="Formatos que produces"
              options={CONTENT_FORMATS}
              values={formats}
              onChange={setFormats}
            />
            <ChipMultiSelect
              label="Rango de edad de tu audiencia"
              options={AGE_RANGES}
              values={audienceAges}
              onChange={setAudienceAges}
            />
            <Combobox
              label="Género predominante de tu audiencia"
              options={AUDIENCE_GENDERS}
              value={audienceGender}
              onChange={setAudienceGender}
              placeholder="Elige…"
            />
            <MultiCombobox
              label="Intereses de tu audiencia"
              options={CONTENT_CATEGORIES}
              values={audienceInterests}
              onChange={setAudienceInterests}
              placeholder="Busca o agrega intereses"
            />
            <Combobox
              label="Alcance de tu audiencia"
              options={AUDIENCE_SCOPES}
              value={audienceScope}
              onChange={setAudienceScope}
              placeholder="Elige…"
            />
          </>
        )}

        {/* --- Consentimientos (Ley 1581) --- */}
        <label className="mt-2 flex items-start gap-2 font-body text-sm text-text">
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
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
            checked={acceptPrivacy}
            onChange={(e) => setAcceptPrivacy(e.target.checked)}
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
            checked={acceptMarketing}
            onChange={(e) => setAcceptMarketing(e.target.checked)}
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
