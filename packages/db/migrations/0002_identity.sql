-- Migración 0002 — identidad y organizaciones

-- Cuenta: una sola identidad, varios perfiles activables
CREATE TABLE account (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email                 citext NOT NULL UNIQUE,
  email_verified_at     timestamptz,
  phone                 varchar(20),
  phone_verified_at     timestamptz,
  full_name             varchar(160) NOT NULL,
  display_name          varchar(80),
  avatar_url            text,
  birth_date            date,
  document_type         varchar(20),          -- CC, CE, PA, NIT
  document_number       varchar(40),
  document_verified_at  timestamptz,
  city                  varchar(80),
  department            varchar(80),
  country               char(2) NOT NULL DEFAULT 'CO',
  locale                varchar(10) NOT NULL DEFAULT 'es-CO',
  timezone              varchar(50) NOT NULL DEFAULT 'America/Bogota',
  verification_level    verification_level NOT NULL DEFAULT 'l0_email',
  external_auth_id      text UNIQUE,          -- id en el proveedor de auth
  last_login_at         timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  CONSTRAINT chk_account_document UNIQUE (document_type, document_number)
);
CREATE INDEX idx_account_email ON account(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_account_phone ON account(phone) WHERE deleted_at IS NULL;

-- Perfil de cliente: siempre activo
CREATE TABLE client_profile (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        uuid NOT NULL UNIQUE REFERENCES account(id),
  preferences       jsonb NOT NULL DEFAULT '{}',   -- categorías, rango de precio, accesibilidad requerida
  accessibility_needs jsonb,                        -- DATO SENSIBLE: requiere consentimiento separado
  attendance_rate   numeric(5,4),                   -- calculado
  total_bookings    integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Perfil de creador
CREATE TABLE creator_profile (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id            uuid NOT NULL UNIQUE REFERENCES account(id),
  handle                citext NOT NULL UNIQUE,
  bio                   text,
  categories            text[] NOT NULL DEFAULT '{}',
  cities                text[] NOT NULL DEFAULT '{}',
  languages             text[] NOT NULL DEFAULT '{es}',
  is_accepting_work     boolean NOT NULL DEFAULT true,
  -- Métricas calculadas, nunca declaradas
  total_followers       integer NOT NULL DEFAULT 0,
  avg_engagement_rate   numeric(5,4),
  fidelity_index        numeric(4,2),      -- Índice de Fidelidad Promocional, -3.00 a 3.00
  fidelity_sample_size  integer NOT NULL DEFAULT 0,
  conversion_rate       numeric(5,4),
  total_attributed_gmv  bigint NOT NULL DEFAULT 0,
  on_time_delivery_rate numeric(5,4),
  avg_revision_rounds   numeric(4,2),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_creator_fidelity CHECK (fidelity_index IS NULL OR fidelity_index BETWEEN -3 AND 3)
);
CREATE INDEX idx_creator_categories ON creator_profile USING gin(categories);
CREATE INDEX idx_creator_cities ON creator_profile USING gin(cities);

-- Audiencia verificada por red social (datos traídos de la API, nunca declarados)
CREATE TABLE verified_audience (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id  uuid NOT NULL REFERENCES creator_profile(id),
  network             social_network NOT NULL,
  network_user_id     varchar(120) NOT NULL,
  network_handle      varchar(120) NOT NULL,
  followers           integer NOT NULL,
  avg_reach           integer,
  engagement_rate     numeric(5,4),
  demographics        jsonb NOT NULL DEFAULT '{}',  -- edad, género, ciudad, país
  active_hours        jsonb,
  verified_at         timestamptz NOT NULL,
  token_ref           uuid,                          -- referencia a external_connection
  anomaly_score       numeric(5,4),                  -- detección de audiencia inflada
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_profile_id, network)
);

-- Serie temporal de audiencia, para detectar picos anómalos
CREATE TABLE audience_snapshot (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verified_audience_id uuid NOT NULL REFERENCES verified_audience(id),
  captured_at         timestamptz NOT NULL,
  followers           integer NOT NULL,
  engagement_rate     numeric(5,4),
  created_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audience_snapshot_time ON audience_snapshot(verified_audience_id, captured_at DESC);

-- Organización: empresa o agencia
CREATE TABLE organization (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                citext NOT NULL UNIQUE,
  legal_name          varchar(200) NOT NULL,
  trade_name          varchar(160) NOT NULL,
  tax_id              varchar(40) NOT NULL,          -- NIT
  tax_id_verified_at  timestamptz,
  tourism_registry    varchar(40),                   -- RNT
  tourism_registry_valid_until date,
  tourism_registry_verified_at timestamptz,
  description         text,
  logo_url            text,
  cover_url           text,
  email               citext NOT NULL,
  phone               varchar(20) NOT NULL,
  whatsapp            varchar(20),
  website             text,
  social_links        jsonb NOT NULL DEFAULT '{}',
  address             text,
  city                varchar(80) NOT NULL,
  department          varchar(80) NOT NULL,
  country             char(2) NOT NULL DEFAULT 'CO',
  latitude            numeric(9,6),
  longitude           numeric(9,6),
  commission_rate     numeric(5,4) NOT NULL DEFAULT 0.1200,
  subscription_tier   varchar(20) NOT NULL DEFAULT 'free',
  is_active           boolean NOT NULL DEFAULT true,
  -- Métricas calculadas
  promise_fidelity    numeric(4,2),
  confirmation_rate   numeric(5,4),
  dispute_rate        numeric(5,4),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  CONSTRAINT chk_org_tax_id UNIQUE (tax_id),
  CONSTRAINT chk_org_fidelity CHECK (promise_fidelity IS NULL OR promise_fidelity BETWEEN -3 AND 3)
);
CREATE INDEX idx_org_city ON organization(city) WHERE deleted_at IS NULL;

-- Membresía: quién puede operar qué organización
CREATE TABLE organization_membership (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  account_id      uuid NOT NULL REFERENCES account(id),
  role            membership_role NOT NULL DEFAULT 'staff',
  invited_by      uuid REFERENCES account(id),
  accepted_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  UNIQUE (organization_id, account_id)
);
CREATE INDEX idx_membership_account ON organization_membership(account_id) WHERE deleted_at IS NULL;

-- Póliza de seguro, requisito para categorías de riesgo
CREATE TABLE insurance_policy (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  insurer         varchar(160) NOT NULL,
  policy_number   varchar(80) NOT NULL,
  coverage_amount bigint NOT NULL,
  currency        char(3) NOT NULL DEFAULT 'COP',
  valid_from      date NOT NULL,
  valid_until     date NOT NULL,
  document_url    text NOT NULL,
  verified_at     timestamptz,
  verified_by     uuid REFERENCES account(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_policy_dates CHECK (valid_until > valid_from)
);
CREATE INDEX idx_policy_org_valid ON insurance_policy(organization_id, valid_until DESC);
