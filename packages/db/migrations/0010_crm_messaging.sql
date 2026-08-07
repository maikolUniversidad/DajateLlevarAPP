-- Migración 0010 — CRM y mensajería

CREATE TABLE crm_contact (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  account_id        uuid REFERENCES account(id),         -- si tiene cuenta en la plataforma
  full_name         varchar(160) NOT NULL,
  email             citext,
  phone             varchar(20),
  whatsapp          varchar(20),
  tags              text[] NOT NULL DEFAULT '{}',
  source            varchar(40),                         -- direct, creator, ota, import, api
  source_creator_id uuid REFERENCES creator_profile(id),
  -- Métricas calculadas
  total_bookings    integer NOT NULL DEFAULT 0,
  total_spent       bigint NOT NULL DEFAULT 0,
  last_booking_at   timestamptz,
  first_booking_at  timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE INDEX idx_crm_org ON crm_contact(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_tags ON crm_contact USING gin(tags);

CREATE TABLE crm_note (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id    uuid NOT NULL REFERENCES crm_contact(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organization(id),
  author_account_id uuid NOT NULL REFERENCES account(id),
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_segment (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  name            varchar(120) NOT NULL,
  definition      jsonb NOT NULL,                        -- reglas del segmento dinámico
  contact_count   integer NOT NULL DEFAULT 0,
  last_computed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Mensajería unificada
CREATE TABLE conversation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id),
  kind              varchar(30) NOT NULL,                -- client_provider, org_creator, support
  subject           varchar(200),
  booking_id        uuid REFERENCES booking(id),
  campaign_id       uuid REFERENCES campaign(id),
  quote_request_id  uuid REFERENCES quote_request(id),
  last_message_at   timestamptz,
  is_archived       boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participant (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  account_id      uuid NOT NULL REFERENCES account(id),
  last_read_at    timestamptz,
  UNIQUE (conversation_id, account_id)
);

CREATE TABLE message (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  sender_account_id uuid REFERENCES account(id),         -- NULL = sistema
  body            text NOT NULL,
  is_ai_generated boolean NOT NULL DEFAULT false,
  external_channel varchar(30),                          -- whatsapp, email
  external_id     varchar(160),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_message_conversation ON message(conversation_id, created_at DESC);

CREATE TABLE message_attachment (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  uuid NOT NULL REFERENCES message(id) ON DELETE CASCADE,
  url         text NOT NULL,
  filename    varchar(200),
  mime_type   varchar(100),
  size_bytes  bigint,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES account(id),
  kind        varchar(60) NOT NULL,
  title       varchar(200) NOT NULL,
  body        text,
  action_url  text,
  channels    text[] NOT NULL DEFAULT '{in_app}',        -- in_app, email, whatsapp, push
  read_at     timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_account ON notification(account_id, created_at DESC) WHERE read_at IS NULL;
