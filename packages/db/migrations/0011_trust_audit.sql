-- Migración 0011 — confianza, disputas y auditoría

CREATE TABLE dispute (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        uuid REFERENCES booking(id),
  campaign_contract_id uuid REFERENCES campaign_contract(id),
  attribution_id    uuid REFERENCES attribution(id),
  organization_id   uuid REFERENCES organization(id),
  opened_by         uuid NOT NULL REFERENCES account(id),
  status            dispute_status NOT NULL DEFAULT 'open',
  reason            text NOT NULL,
  amount_disputed   bigint,
  resolution_notes  text,
  resolved_by       uuid REFERENCES account(id),
  resolved_at       timestamptz,
  evidence_due_at   timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dispute_evidence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id    uuid NOT NULL REFERENCES dispute(id) ON DELETE CASCADE,
  submitted_by  uuid NOT NULL REFERENCES account(id),
  description   text NOT NULL,
  file_url      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fraud_signal (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind              fraud_signal_kind NOT NULL,
  severity          smallint NOT NULL,                   -- 1 a 5
  account_id        uuid REFERENCES account(id),
  organization_id   uuid REFERENCES organization(id),
  creator_profile_id uuid REFERENCES creator_profile(id),
  booking_id        uuid REFERENCES booking(id),
  review_id         uuid REFERENCES review(id),
  details           jsonb NOT NULL DEFAULT '{}',
  reviewed_at       timestamptz,
  reviewed_by       uuid REFERENCES account(id),
  action_taken      varchar(60),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_fraud_severity CHECK (severity BETWEEN 1 AND 5)
);

-- Registro de acciones administrativas: inmutable
CREATE TABLE audit_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id  uuid REFERENCES account(id),
  actor_kind        varchar(20) NOT NULL,                -- user, system, api_client, mcp_client
  action            varchar(80) NOT NULL,
  resource_type     varchar(60) NOT NULL,
  resource_id       uuid,
  organization_id   uuid REFERENCES organization(id),
  before_state      jsonb,
  after_state       jsonb,
  ip_address        inet,
  user_agent        text,
  occurred_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id, occurred_at DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_account_id, occurred_at DESC);

-- EVENTOS DE DOMINIO: append-only. Nunca UPDATE ni DELETE.
-- Fuente de verdad para auditoría, webhooks y analítica.
CREATE TABLE domain_event (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        varchar(80) NOT NULL,
  aggregate_type    varchar(60) NOT NULL,
  aggregate_id      uuid NOT NULL,
  organization_id   uuid,
  actor_account_id  uuid,
  payload           jsonb NOT NULL,
  version           integer NOT NULL DEFAULT 1,
  occurred_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_aggregate ON domain_event(aggregate_type, aggregate_id, occurred_at);
CREATE INDEX idx_event_type_time ON domain_event(event_type, occurred_at DESC);
CREATE INDEX idx_event_org ON domain_event(organization_id, occurred_at DESC);
