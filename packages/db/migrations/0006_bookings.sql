-- Migración 0006 — reservas y cotizaciones

CREATE TABLE booking (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                varchar(12) NOT NULL UNIQUE,        -- código legible: DL-8K3M2P
  organization_id     uuid NOT NULL REFERENCES organization(id),
  service_id          uuid NOT NULL REFERENCES service(id),
  service_variant_id  uuid REFERENCES service_variant(id),
  capacity_session_id uuid REFERENCES capacity_session(id),
  client_account_id   uuid NOT NULL REFERENCES account(id),
  status              booking_status NOT NULL DEFAULT 'draft',
  -- Cuándo
  starts_at           timestamptz,
  ends_at             timestamptz,
  time_range          tstzrange GENERATED ALWAYS AS (tstzrange(starts_at, ends_at, '[)')) STORED,
  -- Cuánto
  participants        integer NOT NULL DEFAULT 1,
  unit_price          bigint NOT NULL,
  subtotal            bigint NOT NULL,
  discount_amount     bigint NOT NULL DEFAULT 0,
  platform_fee        bigint NOT NULL DEFAULT 0,
  total_amount        bigint NOT NULL,
  currency            char(3) NOT NULL DEFAULT 'COP',
  -- Contexto
  client_notes        text,
  provider_notes      text,
  cancellation_reason text,
  cancelled_at        timestamptz,
  cancelled_by        uuid REFERENCES account(id),
  refund_amount       bigint NOT NULL DEFAULT 0,
  confirmed_at        timestamptz,
  checked_in_at       timestamptz,
  completed_at        timestamptz,
  -- Requisitos de riesgo
  waiver_signed_at    timestamptz,
  waiver_document_url text,
  -- Origen
  source              varchar(30) NOT NULL DEFAULT 'direct',  -- direct, creator, ota, api, mcp
  external_channel    varchar(60),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_booking_amounts CHECK (total_amount >= 0 AND subtotal >= 0),
  CONSTRAINT chk_booking_range CHECK (ends_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX idx_booking_org_time ON booking(organization_id, starts_at DESC);
CREATE INDEX idx_booking_client ON booking(client_account_id, created_at DESC);
CREATE INDEX idx_booking_status ON booking(status) WHERE status IN ('pending_payment','pending_confirmation','confirmed');

-- ESTA es la defensa real contra la doble reserva: a nivel de base de datos, no de aplicación
CREATE TABLE booking_resource (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id   uuid NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  resource_id  uuid NOT NULL REFERENCES resource(id),
  time_range   tstzrange NOT NULL,
  EXCLUDE USING gist (resource_id WITH =, time_range WITH &&)
);

-- Participantes de una reserva grupal
CREATE TABLE booking_participant (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  uuid NOT NULL REFERENCES booking(id) ON DELETE CASCADE,
  full_name   varchar(160) NOT NULL,
  document_number varchar(40),
  age         integer,
  notes       text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Cotizaciones para servicios bajo demanda
CREATE TABLE quote_request (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  service_id        uuid NOT NULL REFERENCES service(id),
  client_account_id uuid NOT NULL REFERENCES account(id),
  status            quote_status NOT NULL DEFAULT 'requested',
  brief             text NOT NULL,
  desired_date      date,
  participants      integer,
  budget_hint       bigint,
  expires_at        timestamptz,
  converted_booking_id uuid REFERENCES booking(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE quote_offer (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id uuid NOT NULL REFERENCES quote_request(id),
  version         integer NOT NULL DEFAULT 1,
  amount          bigint NOT NULL,
  currency        char(3) NOT NULL DEFAULT 'COP',
  scope           text NOT NULL,
  valid_until     timestamptz,
  created_by      uuid NOT NULL REFERENCES account(id),
  accepted_at     timestamptz,
  rejected_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (quote_request_id, version)
);
