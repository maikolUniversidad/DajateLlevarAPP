-- Migración 0012 — interoperabilidad, IA y MCP

-- Conexiones OAuth a sistemas externos. Los tokens se guardan CIFRADOS.
CREATE TABLE external_connection (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id),
  account_id        uuid REFERENCES account(id),
  kind              connector_kind NOT NULL,
  provider          varchar(60) NOT NULL,                -- google_calendar, hubspot, tiktok, wompi...
  external_account_id varchar(200),
  external_account_label varchar(200),
  access_token_encrypted  text NOT NULL,
  refresh_token_encrypted text,
  token_expires_at  timestamptz,
  scopes            text[] NOT NULL DEFAULT '{}',
  direction         sync_direction NOT NULL DEFAULT 'bidirectional',
  status            sync_status NOT NULL DEFAULT 'ok',
  last_sync_at      timestamptz,
  sync_cursor       text,                                -- token de cambio incremental
  revoked_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   uuid NOT NULL REFERENCES external_connection(id),
  direction       sync_direction NOT NULL,
  records_in      integer NOT NULL DEFAULT 0,
  records_out     integer NOT NULL DEFAULT 0,
  status          sync_status NOT NULL,
  error_message   text,
  started_at      timestamptz NOT NULL,
  finished_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Aplicaciones de terceros registradas
CREATE TABLE api_client (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id),
  name              varchar(160) NOT NULL,
  client_id         varchar(64) NOT NULL UNIQUE,
  client_secret_hash text NOT NULL,
  redirect_uris     text[] NOT NULL DEFAULT '{}',
  allowed_scopes    text[] NOT NULL DEFAULT '{}',
  is_mcp_client     boolean NOT NULL DEFAULT false,
  rate_limit_tier   varchar(20) NOT NULL DEFAULT 'standard',
  revoked_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Autorizaciones concedidas: el usuario puede revocar POR HERRAMIENTA, no solo por app
CREATE TABLE api_grant (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_client_id     uuid NOT NULL REFERENCES api_client(id),
  account_id        uuid NOT NULL REFERENCES account(id),
  organization_id   uuid REFERENCES organization(id),
  granted_scopes    text[] NOT NULL,
  denied_tools      text[] NOT NULL DEFAULT '{}',        -- revocación granular por herramienta MCP
  spend_limit_per_session bigint,                        -- límite de gasto por sesión
  expires_at        timestamptz,
  revoked_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Registro de toda llamada MCP, visible para el usuario
CREATE TABLE mcp_call_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_client_id   uuid NOT NULL REFERENCES api_client(id),
  account_id      uuid NOT NULL REFERENCES account(id),
  organization_id uuid REFERENCES organization(id),
  tool_name       varchar(80) NOT NULL,
  arguments       jsonb,
  result_summary  text,
  required_confirmation boolean NOT NULL DEFAULT false,
  confirmed_at    timestamptz,
  status          varchar(20) NOT NULL,                  -- ok, denied, error, awaiting_confirmation
  error_message   text,
  duration_ms     integer,
  called_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mcp_log_account ON mcp_call_log(account_id, called_at DESC);

-- Suscripciones a webhooks
CREATE TABLE webhook_subscription (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  api_client_id     uuid REFERENCES api_client(id),
  url               text NOT NULL,
  secret            varchar(64) NOT NULL,
  event_types       text[] NOT NULL,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_delivery (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES webhook_subscription(id),
  domain_event_id uuid NOT NULL REFERENCES domain_event(id),
  attempt         integer NOT NULL DEFAULT 1,
  response_status integer,
  response_body   text,
  succeeded_at    timestamptz,
  next_retry_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_retry ON webhook_delivery(next_retry_at) WHERE succeeded_at IS NULL;

-- Trazabilidad de la IA: modelo, entrada, salida, quién aceptó
CREATE TABLE ai_invocation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case          varchar(60) NOT NULL,                -- semantic_search, publish_assistant, matching...
  provider          varchar(30) NOT NULL,
  model             varchar(80) NOT NULL,
  account_id        uuid REFERENCES account(id),
  organization_id   uuid REFERENCES organization(id),
  input_summary     text,
  output_summary    text,
  tokens_input      integer,
  tokens_output     integer,
  cost_micros       bigint,
  latency_ms        integer,
  was_accepted      boolean,
  accepted_by       uuid REFERENCES account(id),
  cache_hit         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_org_cost ON ai_invocation(organization_id, created_at DESC);
