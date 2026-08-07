-- Migración 0016 — RLS para organization y organization_membership
--
-- Cierra la brecha de 0013: estas dos tablas quedaron sin Row Level Security.
-- Hoy no bloquea nada porque la app conecta como rol propietario (RLS ignorado),
-- pero con un rol restringido (sin BYPASSRLS) el modelo multi-inquilino (§5,
-- regla 4 de CLAUDE.md) exige que la pertenencia gobierne el acceso. Defensa en
-- profundidad: un fallo en la capa de aplicación no debe exponer datos de otra
-- organización.

-- =====================================================================
-- organization — perfil público del proveedor
-- =====================================================================

ALTER TABLE organization ENABLE ROW LEVEL SECURITY;

-- Lectura pública del proveedor activo (P01 portada, P02 búsqueda, ficha
-- pública). La proyección de columnas públicas se decide en la consulta: RLS
-- es a nivel de fila, no de columna, así que datos internos (tax_id,
-- commission_rate, subscription_tier, dispute_rate…) NO deben proyectarse a
-- clientes desde la capa de aplicación aunque la fila sea visible.
CREATE POLICY organization_public_read ON organization
  FOR SELECT
  USING (is_active AND deleted_at IS NULL);

-- Los miembros gestionan su propia organización: verla aunque esté inactiva o
-- borrada, actualizarla y borrarla. Política permisiva: se combina con OR con
-- la lectura pública.
CREATE POLICY organization_member_manage ON organization
  FOR ALL
  USING (id IN (SELECT current_user_organizations()))
  WITH CHECK (id IN (SELECT current_user_organizations()));

-- Alta de empresa: el INSERT de una organización nueva NO lo autoriza ninguna
-- política, porque en el momento del INSERT la cuenta aún no es miembro y el
-- WITH CHECK evalúa a falso. El onboarding (activateBusinessProfile →
-- OrganizationRepository.create) debe insertar org + membresía owner con el rol
-- de servicio (BYPASSRLS) dentro de una transacción; crear un inquilino del que
-- todavía no eres miembro es, por definición, una operación privilegiada que la
-- pertenencia no puede autorizar.

-- =====================================================================
-- organization_membership — pertenencia
-- =====================================================================

ALTER TABLE organization_membership ENABLE ROW LEVEL SECURITY;

-- La cuenta ve y gestiona sus propias membresías; además, cualquier miembro de
-- una organización ve el resto del equipo de esa organización.
CREATE POLICY organization_membership_access ON organization_membership
  FOR ALL
  USING (
    account_id = current_setting('app.current_account_id', true)::uuid
    OR organization_id IN (SELECT current_user_organizations())
  )
  WITH CHECK (
    account_id = current_setting('app.current_account_id', true)::uuid
    OR organization_id IN (SELECT current_user_organizations())
  );

-- Sin recursión: current_user_organizations() (definida en 0013) es
-- SECURITY DEFINER y STABLE. Corre con los privilegios del dueño de la tabla,
-- que ignora RLS (no existe FORCE ROW LEVEL SECURITY sobre estas tablas), así
-- que su SELECT interno sobre organization_membership no vuelve a evaluar esta
-- política. La membresía owner recién creada en el alta satisface el WITH CHECK
-- por account_id = app.current_account_id, de modo que puede insertarse bajo
-- contexto de cuenta (withAccountContext) una vez la organización existe.
