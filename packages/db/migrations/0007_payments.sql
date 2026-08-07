-- Migración 0007 — pagos y ledger

CREATE TABLE payment (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid REFERENCES booking(id),
  campaign_id         uuid,                              -- si es pago de campaña
  organization_id     uuid NOT NULL REFERENCES organization(id),
  payer_account_id    uuid NOT NULL REFERENCES account(id),
  status              payment_status NOT NULL DEFAULT 'created',
  method              payment_method,
  amount              bigint NOT NULL,
  currency            char(3) NOT NULL DEFAULT 'COP',
  gateway_fee         bigint NOT NULL DEFAULT 0,
  -- Proveedor
  provider            varchar(30) NOT NULL,              -- wompi, mercadopago
  provider_reference  varchar(160),
  provider_transaction_id varchar(160),
  provider_payload    jsonb,
  -- Ciclo
  authorized_at       timestamptz,
  held_at             timestamptz,
  released_at         timestamptz,
  refunded_at         timestamptz,
  failed_at           timestamptz,
  failure_reason      text,
  idempotency_key     varchar(120) UNIQUE,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_payment_amount CHECK (amount > 0)
);
CREATE INDEX idx_payment_booking ON payment(booking_id);
CREATE INDEX idx_payment_provider_ref ON payment(provider, provider_transaction_id);

-- Eventos del proveedor de pago, con idempotencia: si el mismo evento llega tres veces, se procesa una
CREATE TABLE payment_webhook_event (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider            varchar(30) NOT NULL,
  provider_event_id   varchar(160) NOT NULL,
  event_type          varchar(80) NOT NULL,
  signature_valid     boolean NOT NULL,
  payload             jsonb NOT NULL,
  processed_at        timestamptz,
  processing_error    text,
  received_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_event_id)
);

-- LEDGER DE DOBLE ENTRADA — append-only, nunca UPDATE ni DELETE
-- El saldo NUNCA se guarda: se calcula sumando asientos.
CREATE TABLE ledger_entry (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id    uuid NOT NULL,                       -- agrupa los asientos de una operación
  account_type      ledger_account NOT NULL,
  side              ledger_side NOT NULL,
  amount            bigint NOT NULL,
  currency          char(3) NOT NULL DEFAULT 'COP',
  -- A quién pertenece este asiento
  organization_id   uuid REFERENCES organization(id),
  account_id        uuid REFERENCES account(id),
  -- Referencias
  booking_id        uuid REFERENCES booking(id),
  payment_id        uuid REFERENCES payment(id),
  campaign_id       uuid,
  payout_id         uuid,
  -- Contexto fiscal, calculado en el momento de la transacción
  tax_kind          varchar(30),                         -- vat, withholding, ica
  tax_rate          numeric(5,4),
  municipality_code varchar(10),                         -- para ReteICA
  description       text NOT NULL,
  occurred_at       timestamptz NOT NULL DEFAULT now(),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_ledger_amount CHECK (amount > 0)
);
CREATE INDEX idx_ledger_transaction ON ledger_entry(transaction_id);
CREATE INDEX idx_ledger_org ON ledger_entry(organization_id, occurred_at DESC);
CREATE INDEX idx_ledger_account ON ledger_entry(account_id, occurred_at DESC);

-- Regla de integridad contable: cada transaction_id debe cuadrar (suma debe = suma haber).
-- Se verifica con un trigger diferido o con una prueba de integridad programada.

-- Retiros de fondos
CREATE TABLE payout (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id),
  account_id        uuid REFERENCES account(id),         -- creador
  status            payout_status NOT NULL DEFAULT 'requested',
  amount            bigint NOT NULL,
  currency          char(3) NOT NULL DEFAULT 'COP',
  -- Destino: siempre a nombre del titular verificado
  destination_kind  varchar(30) NOT NULL,                -- bank_account, nequi, daviplata, bre_b
  destination_ref   varchar(120) NOT NULL,
  destination_holder_document varchar(40) NOT NULL,
  provider          varchar(30),
  provider_reference varchar(160),
  requested_at      timestamptz NOT NULL DEFAULT now(),
  processed_at      timestamptz,
  failed_reason     text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_payout_target CHECK (
    (organization_id IS NOT NULL AND account_id IS NULL) OR
    (organization_id IS NULL AND account_id IS NOT NULL)
  )
);

-- Cuentas de destino registradas y verificadas
CREATE TABLE payout_account (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id),
  account_id        uuid REFERENCES account(id),
  kind              varchar(30) NOT NULL,
  bank_code         varchar(20),
  account_number_encrypted text NOT NULL,
  account_type      varchar(20),
  holder_name       varchar(160) NOT NULL,
  holder_document   varchar(40) NOT NULL,
  verified_at       timestamptz,
  is_default        boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Facturación electrónica DIAN
CREATE TABLE invoice (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  booking_id        uuid REFERENCES booking(id),
  campaign_id       uuid,
  kind              varchar(30) NOT NULL,                -- invoice, support_document, credit_note
  number            varchar(60),
  cufe              varchar(200),                        -- código único de facturación electrónica
  issued_at         timestamptz,
  subtotal          bigint NOT NULL,
  vat_amount        bigint NOT NULL DEFAULT 0,
  withholding_amount bigint NOT NULL DEFAULT 0,
  total             bigint NOT NULL,
  currency          char(3) NOT NULL DEFAULT 'COP',
  pdf_url           text,
  xml_url           text,
  provider          varchar(30),
  provider_status   varchar(40),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Promociones
CREATE TABLE promotion (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  code              citext NOT NULL,
  name              varchar(160) NOT NULL,
  discount_kind     varchar(20) NOT NULL,                -- percentage, fixed_amount
  discount_value    numeric(10,4) NOT NULL,
  max_discount      bigint,
  min_purchase      bigint,
  applies_to_service_ids uuid[],
  usage_limit       integer,
  usage_per_client  integer NOT NULL DEFAULT 1,
  used_count        integer NOT NULL DEFAULT 0,
  budget_cap        bigint,
  budget_used       bigint NOT NULL DEFAULT 0,
  valid_from        timestamptz NOT NULL,
  valid_until       timestamptz NOT NULL,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code),
  CONSTRAINT chk_promo_dates CHECK (valid_until > valid_from)
);

CREATE TABLE promotion_redemption (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promotion_id  uuid NOT NULL REFERENCES promotion(id),
  booking_id    uuid NOT NULL REFERENCES booking(id),
  account_id    uuid NOT NULL REFERENCES account(id),
  discount_applied bigint NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (promotion_id, booking_id)
);
