-- Migración 0013 — seguridad a nivel de fila (RLS)

-- Función auxiliar: organizaciones a las que pertenece el usuario actual
CREATE OR REPLACE FUNCTION current_user_organizations()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id
  FROM organization_membership
  WHERE account_id = current_setting('app.current_account_id', true)::uuid
    AND accepted_at IS NOT NULL
    AND deleted_at IS NULL;
$$;

-- =====================================================================
-- Por organización — pertenencia vía organization_membership
-- =====================================================================

ALTER TABLE service ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_org_access ON service
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE service_variant ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_variant_org_access ON service_variant
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE service_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_media_org_access ON service_media
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE resource ENABLE ROW LEVEL SECURITY;
CREATE POLICY resource_org_access ON resource
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE availability_rule ENABLE ROW LEVEL SECURITY;
CREATE POLICY availability_rule_org_access ON availability_rule
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE availability_exception ENABLE ROW LEVEL SECURITY;
CREATE POLICY availability_exception_org_access ON availability_exception
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE capacity_session ENABLE ROW LEVEL SECURITY;
CREATE POLICY capacity_session_org_access ON capacity_session
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE booking ENABLE ROW LEVEL SECURITY;
CREATE POLICY booking_org_access ON booking
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE payment ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_org_access ON payment
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE payout ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_org_access ON payout
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE invoice ENABLE ROW LEVEL SECURITY;
CREATE POLICY invoice_org_access ON invoice
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE promotion ENABLE ROW LEVEL SECURITY;
CREATE POLICY promotion_org_access ON promotion
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE crm_contact ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_contact_org_access ON crm_contact
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE crm_note ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_note_org_access ON crm_note
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE crm_segment ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_segment_org_access ON crm_segment
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE campaign ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaign_org_access ON campaign
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

-- campaign_application no lleva organization_id: se resuelve por la campaña.
ALTER TABLE campaign_application ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaign_application_org_access ON campaign_application
  FOR ALL
  USING (
    campaign_id IN (
      SELECT id FROM campaign
      WHERE organization_id IN (SELECT current_user_organizations())
    )
  );

ALTER TABLE campaign_contract ENABLE ROW LEVEL SECURITY;
CREATE POLICY campaign_contract_org_access ON campaign_contract
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE insurance_policy ENABLE ROW LEVEL SECURITY;
CREATE POLICY insurance_policy_org_access ON insurance_policy
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE external_connection ENABLE ROW LEVEL SECURITY;
CREATE POLICY external_connection_org_access ON external_connection
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE webhook_subscription ENABLE ROW LEVEL SECURITY;
CREATE POLICY webhook_subscription_org_access ON webhook_subscription
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

-- =====================================================================
-- Por cuenta — coincidencia con account_id
-- =====================================================================

ALTER TABLE client_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY client_profile_account_access ON client_profile
  FOR ALL
  USING (account_id = current_setting('app.current_account_id', true)::uuid);

ALTER TABLE creator_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY creator_profile_account_access ON creator_profile
  FOR ALL
  USING (account_id = current_setting('app.current_account_id', true)::uuid);

-- collection usa owner_account_id, no account_id.
ALTER TABLE collection ENABLE ROW LEVEL SECURITY;
CREATE POLICY collection_account_access ON collection
  FOR ALL
  USING (owner_account_id = current_setting('app.current_account_id', true)::uuid);

ALTER TABLE notification ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_account_access ON notification
  FOR ALL
  USING (account_id = current_setting('app.current_account_id', true)::uuid);

ALTER TABLE consent ENABLE ROW LEVEL SECURITY;
CREATE POLICY consent_account_access ON consent
  FOR ALL
  USING (account_id = current_setting('app.current_account_id', true)::uuid);

ALTER TABLE data_subject_request ENABLE ROW LEVEL SECURITY;
CREATE POLICY data_subject_request_account_access ON data_subject_request
  FOR ALL
  USING (account_id = current_setting('app.current_account_id', true)::uuid);

ALTER TABLE payout_account ENABLE ROW LEVEL SECURITY;
CREATE POLICY payout_account_account_access ON payout_account
  FOR ALL
  USING (account_id = current_setting('app.current_account_id', true)::uuid);

-- =====================================================================
-- Mixtas — política compuesta con OR
-- =====================================================================

ALTER TABLE review ENABLE ROW LEVEL SECURITY;
CREATE POLICY review_mixed_access ON review
  FOR ALL
  USING (
    organization_id IN (SELECT current_user_organizations())
    OR author_account_id = current_setting('app.current_account_id', true)::uuid
  );

ALTER TABLE conversation ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversation_mixed_access ON conversation
  FOR ALL
  USING (
    organization_id IN (SELECT current_user_organizations())
    OR id IN (
      SELECT conversation_id FROM conversation_participant
      WHERE account_id = current_setting('app.current_account_id', true)::uuid
    )
  );

ALTER TABLE attribution ENABLE ROW LEVEL SECURITY;
CREATE POLICY attribution_mixed_access ON attribution
  FOR ALL
  USING (
    creator_profile_id IN (
      SELECT id FROM creator_profile
      WHERE account_id = current_setting('app.current_account_id', true)::uuid
    )
    OR campaign_id IN (
      SELECT id FROM campaign
      WHERE organization_id IN (SELECT current_user_organizations())
    )
  );

ALTER TABLE ledger_entry ENABLE ROW LEVEL SECURITY;
CREATE POLICY ledger_entry_mixed_access ON ledger_entry
  FOR ALL
  USING (
    organization_id IN (SELECT current_user_organizations())
    OR account_id = current_setting('app.current_account_id', true)::uuid
  );

-- =====================================================================
-- Públicas de lectura — USING (true) para SELECT
-- =====================================================================

ALTER TABLE category ENABLE ROW LEVEL SECURITY;
CREATE POLICY category_public_read ON category
  FOR SELECT
  USING (true);

ALTER TABLE policy_version ENABLE ROW LEVEL SECURITY;
CREATE POLICY policy_version_public_read ON policy_version
  FOR SELECT
  USING (true);

-- =====================================================================
-- Solo servicio — sin acceso desde el rol de cliente.
-- Se habilita RLS sin política permisiva: el acceso queda denegado por
-- defecto para roles sin BYPASSRLS.
-- =====================================================================

ALTER TABLE domain_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fraud_signal ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_webhook_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcp_call_log ENABLE ROW LEVEL SECURITY;
