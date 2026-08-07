-- Migración 0014 — administración de plataforma (backoffice): roles y acceso al log
--
-- Introduce el concepto de STAFF DE PLATAFORMA (transversal a las organizaciones),
-- ausente hasta ahora: membership_role es por organización. El staff opera la
-- consola /admin (§7.6, X01–X15) y es quien puede leer audit_log y domain_event.

-- Rol de plataforma. Cada rol es un paquete de permisos granulares que vive en el
-- dominio (packages/core/authz). extra_permissions permite sumar permisos sueltos.
DO $$ BEGIN
  CREATE TYPE platform_role AS ENUM ('super_admin','moderator','finance','support','analyst');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE platform_staff (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        uuid NOT NULL UNIQUE REFERENCES account(id),
  role              platform_role NOT NULL,
  extra_permissions text[] NOT NULL DEFAULT '{}',
  granted_by        uuid REFERENCES account(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE INDEX idx_platform_staff_account ON platform_staff(account_id) WHERE deleted_at IS NULL;

-- Función auxiliar: ¿la cuenta actual es staff de plataforma? Análoga a
-- current_user_organizations() (§5). Se apoya en app.current_account_id.
CREATE OR REPLACE FUNCTION is_platform_staff()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM platform_staff
    WHERE account_id = current_setting('app.current_account_id', true)::uuid
      AND deleted_at IS NULL
  );
$$;

-- RLS: el propio staff puede leerse a sí mismo y a los demás miembros del staff.
-- La escritura fina (roles:manage) la aplica la API; a nivel de fila basta con
-- restringir a staff de plataforma.
ALTER TABLE platform_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_staff_staff_read ON platform_staff
  FOR SELECT
  USING (is_platform_staff());

-- audit_log y domain_event ya tienen RLS activo sin política (0013 = denegado por
-- defecto). Se abre la LECTURA únicamente al staff de plataforma; siguen sin
-- política de escritura (append-only desde el rol de servicio).
CREATE POLICY audit_log_staff_read ON audit_log
  FOR SELECT
  USING (is_platform_staff());

CREATE POLICY domain_event_staff_read ON domain_event
  FOR SELECT
  USING (is_platform_staff());
