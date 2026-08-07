-- Migración 0016 — datos extra de empresa: sector (gremio) y sedes
--
-- El registro unificado de Empresa (§10.1) captura el gremio/sector del negocio y,
-- opcionalmente, sus sedes (locales). Hasta ahora el backend los descartaba: no
-- había dónde guardarlos. Esta migración añade la columna `sector` a organization
-- y una tabla `organization_location` para las sedes.

-- Gremio / sector del negocio (p. ej. restaurante, hotel, spa). Texto libre
-- normalizado en el cliente; sin catálogo en BD por ahora.
ALTER TABLE organization ADD COLUMN sector varchar(80);

-- Sedes (locales) de una organización. Una empresa puede operar en varias; el
-- selector de registro las envía inline y se crean junto con la organización.
CREATE TABLE organization_location (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  name            varchar(160) NOT NULL,
  address         text,
  city            varchar(80) NOT NULL,
  department      varchar(80) NOT NULL,
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz
);
CREATE INDEX idx_org_location_org ON organization_location(organization_id) WHERE deleted_at IS NULL;

-- RLS: las sedes se acceden por pertenencia a la organización, igual que el resto
-- de datos operativos por organización (§5, ver 0013_rls.sql).
ALTER TABLE organization_location ENABLE ROW LEVEL SECURITY;
CREATE POLICY organization_location_org_access ON organization_location
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));
