-- Migración 0009 — campañas, creadores y atribución

CREATE TABLE campaign (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  code              varchar(12) NOT NULL UNIQUE,
  name              varchar(160) NOT NULL,
  status            campaign_status NOT NULL DEFAULT 'draft',
  model             campaign_model NOT NULL DEFAULT 'affiliate',
  -- Brief
  objective         text NOT NULL,
  target_audience   text,
  key_messages      text,
  do_not_mention    text,
  reference_urls    text[],
  brand_assets_url  text,
  -- Alcance
  service_ids       uuid[] NOT NULL DEFAULT '{}',
  target_cities     text[],
  target_categories text[],
  -- Economía
  budget_total      bigint,
  fee_per_creator   bigint,
  commission_rate   numeric(5,4),                        -- para modelo afiliado o híbrido
  currency          char(3) NOT NULL DEFAULT 'COP',
  -- Plazos
  applications_close_at timestamptz,
  content_due_at    timestamptz,
  publish_window_start timestamptz,
  publish_window_end   timestamptz,
  -- Licencia de uso del contenido
  content_license   varchar(40) NOT NULL DEFAULT 'organic_only', -- organic_only, paid_ads, full_buyout
  license_duration_days integer,
  exclusivity_days  integer NOT NULL DEFAULT 0,
  -- Resultados calculados
  total_reach       integer NOT NULL DEFAULT 0,
  total_clicks      integer NOT NULL DEFAULT 0,
  attributed_bookings integer NOT NULL DEFAULT 0,
  attributed_gmv    bigint NOT NULL DEFAULT 0,
  roas              numeric(8,2),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE INDEX idx_campaign_org_status ON campaign(organization_id, status);
CREATE INDEX idx_campaign_open ON campaign(status, applications_close_at) WHERE status = 'open';

-- Entregables requeridos por la campaña
CREATE TABLE campaign_deliverable_spec (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   uuid NOT NULL REFERENCES campaign(id) ON DELETE CASCADE,
  network       social_network NOT NULL,
  format        varchar(40) NOT NULL,                    -- reel, story, post, video, live
  quantity      integer NOT NULL DEFAULT 1,
  min_duration_seconds integer,
  requirements  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Postulaciones e invitaciones
CREATE TABLE campaign_application (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         uuid NOT NULL REFERENCES campaign(id),
  creator_profile_id  uuid NOT NULL REFERENCES creator_profile(id),
  status              application_status NOT NULL DEFAULT 'submitted',
  is_invitation       boolean NOT NULL DEFAULT false,    -- true si la empresa invitó
  pitch               text,
  proposed_fee        bigint,
  match_score         numeric(5,4),                      -- puntaje de ajuste calculado
  match_explanation   jsonb,                             -- factores que explican el puntaje
  responded_at        timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, creator_profile_id)
);

-- Negociación: cada contraoferta queda registrada
CREATE TABLE campaign_offer (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    uuid NOT NULL REFERENCES campaign_application(id),
  version           integer NOT NULL DEFAULT 1,
  proposed_by       varchar(20) NOT NULL,                -- organization, creator
  fee               bigint,
  commission_rate   numeric(5,4),
  deliverables      jsonb NOT NULL,
  due_at            timestamptz,
  notes             text,
  accepted_at       timestamptz,
  rejected_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id, version)
);

-- Contrato firmado
CREATE TABLE campaign_contract (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id       uuid NOT NULL REFERENCES campaign(id),
  application_id    uuid NOT NULL UNIQUE REFERENCES campaign_application(id),
  creator_profile_id uuid NOT NULL REFERENCES creator_profile(id),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  template_version  varchar(20) NOT NULL,
  content_url       text NOT NULL,
  content_hash      varchar(64) NOT NULL,
  -- Términos
  fee               bigint NOT NULL DEFAULT 0,
  commission_rate   numeric(5,4),
  content_license   varchar(40) NOT NULL,
  license_duration_days integer,
  exclusivity_days  integer NOT NULL DEFAULT 0,
  max_revision_rounds integer NOT NULL DEFAULT 2,
  auto_approve_days integer NOT NULL DEFAULT 5,          -- aprobación tácita, protege al creador
  requires_ad_disclosure boolean NOT NULL DEFAULT true,  -- guía SIC 2020
  -- Firmas
  org_signed_at     timestamptz,
  org_signed_by     uuid REFERENCES account(id),
  creator_signed_at timestamptz,
  terminated_at     timestamptz,
  termination_reason text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Escrow: dinero retenido contra entregables
CREATE TABLE campaign_escrow (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id   uuid NOT NULL UNIQUE REFERENCES campaign_contract(id),
  payment_id    uuid REFERENCES payment(id),
  amount        bigint NOT NULL,
  currency      char(3) NOT NULL DEFAULT 'COP',
  held_at       timestamptz,
  released_at   timestamptz,
  refunded_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Entregables entregados
CREATE TABLE campaign_deliverable (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id     uuid NOT NULL REFERENCES campaign_contract(id),
  spec_id         uuid REFERENCES campaign_deliverable_spec(id),
  status          deliverable_status NOT NULL DEFAULT 'pending',
  draft_url       text,
  network         social_network,
  format          varchar(40),
  revision_round  integer NOT NULL DEFAULT 0,
  submitted_at    timestamptz,
  approved_at     timestamptz,
  auto_approve_at timestamptz,                           -- calculado al enviar
  rejected_reason text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Comentarios con marca de tiempo sobre el video
CREATE TABLE deliverable_comment (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id  uuid NOT NULL REFERENCES campaign_deliverable(id) ON DELETE CASCADE,
  author_account_id uuid NOT NULL REFERENCES account(id),
  timestamp_seconds numeric(8,2),
  body            text NOT NULL,
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Publicación real en la red social, con verificación de revelación publicitaria
CREATE TABLE social_publication (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deliverable_id  uuid NOT NULL REFERENCES campaign_deliverable(id),
  creator_profile_id uuid NOT NULL REFERENCES creator_profile(id),
  network         social_network NOT NULL,
  post_id         varchar(160) NOT NULL,
  post_url        text NOT NULL,
  caption         text,
  -- Verificación de la guía SIC: obligatorio revelar contenido pagado
  ad_disclosure_found boolean,
  ad_disclosure_text  varchar(200),
  disclosure_verified_at timestamptz,
  -- Métricas
  views           integer,
  likes           integer,
  comments        integer,
  shares          integer,
  saves           integer,
  last_metrics_at timestamptz,
  published_at    timestamptz NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (network, post_id)
);

-- Enlaces y códigos de seguimiento
CREATE TABLE tracking_link (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id  uuid NOT NULL REFERENCES creator_profile(id),
  campaign_id         uuid REFERENCES campaign(id),
  organization_id     uuid REFERENCES organization(id),
  service_id          uuid REFERENCES service(id),
  slug                varchar(20) NOT NULL UNIQUE,       -- dl.co/r/AB12CD
  creator_code        varchar(20) UNIQUE,                -- código aplicable en el pago
  signature           varchar(64) NOT NULL,
  click_count         integer NOT NULL DEFAULT 0,
  booking_count       integer NOT NULL DEFAULT 0,
  is_active           boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE tracking_click (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_link_id  uuid NOT NULL REFERENCES tracking_link(id),
  visitor_id        varchar(64) NOT NULL,                -- cookie de primera parte
  referrer          text,
  user_agent        text,
  ip_hash           varchar(64),                         -- hash, nunca IP en claro
  country           char(2),
  city              varchar(80),
  clicked_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_click_visitor ON tracking_click(visitor_id, clicked_at DESC);

-- ATRIBUCIÓN: entidad propia, no campo de la reserva.
-- Una reserva puede tener varios toques con pesos distintos.
CREATE TABLE attribution (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id          uuid NOT NULL REFERENCES booking(id),
  creator_profile_id  uuid REFERENCES creator_profile(id),
  campaign_id         uuid REFERENCES campaign(id),
  tracking_link_id    uuid REFERENCES tracking_link(id),
  social_publication_id uuid REFERENCES social_publication(id),
  mechanism           attribution_mechanism NOT NULL,
  model               attribution_model NOT NULL DEFAULT 'last_non_direct',
  weight              numeric(5,4) NOT NULL DEFAULT 1.0,
  touch_at            timestamptz NOT NULL,
  window_days         integer NOT NULL DEFAULT 30,
  -- Economía
  commission_rate     numeric(5,4),
  commission_amount   bigint,
  -- Disputa
  is_disputed         boolean NOT NULL DEFAULT false,
  resolved_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_attribution_weight CHECK (weight > 0 AND weight <= 1)
);
CREATE INDEX idx_attribution_booking ON attribution(booking_id);
CREATE INDEX idx_attribution_creator ON attribution(creator_profile_id, touch_at DESC);
