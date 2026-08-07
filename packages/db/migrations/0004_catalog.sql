-- Migración 0004 — catálogo de servicios

-- Taxonomía, cargada como semilla y editable sin migración
CREATE TABLE category (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          citext NOT NULL UNIQUE,
  name_es       varchar(120) NOT NULL,
  parent_id     uuid REFERENCES category(id),
  icon          varchar(60),
  risk_category risk_category NOT NULL DEFAULT 'none',
  sort_order    integer NOT NULL DEFAULT 0,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE service (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       uuid NOT NULL REFERENCES organization(id),
  slug                  citext NOT NULL,
  name                  varchar(160) NOT NULL,
  short_description     varchar(280),
  description           text NOT NULL,
  category_id           uuid NOT NULL REFERENCES category(id),
  modality              service_modality NOT NULL,
  status                service_status NOT NULL DEFAULT 'draft',
  -- Precio
  pricing_mode          pricing_mode NOT NULL DEFAULT 'fixed',
  base_price            bigint,                  -- centavos
  currency              char(3) NOT NULL DEFAULT 'COP',
  price_per             varchar(20) NOT NULL DEFAULT 'person',  -- person, group, hour, session
  -- Operación
  duration_minutes      integer,
  min_participants      integer NOT NULL DEFAULT 1,
  max_participants      integer,
  min_advance_hours     integer NOT NULL DEFAULT 2,
  max_advance_days      integer NOT NULL DEFAULT 180,
  buffer_before_minutes integer NOT NULL DEFAULT 0,
  buffer_after_minutes  integer NOT NULL DEFAULT 0,
  requires_confirmation boolean NOT NULL DEFAULT false,
  -- Ubicación
  location_mode         location_mode NOT NULL DEFAULT 'on_site',
  address               text,
  city                  varchar(80),
  department            varchar(80),
  latitude              numeric(9,6),
  longitude             numeric(9,6),
  meeting_point         text,
  -- Políticas y requisitos
  cancellation_policy   cancellation_policy NOT NULL DEFAULT 'moderate',
  prerequisites         text,
  what_is_included      text,
  what_is_not_included  text,
  languages             text[] NOT NULL DEFAULT '{es}',
  -- Riesgo y accesibilidad
  risk_category         risk_category NOT NULL DEFAULT 'none',
  requires_waiver       boolean NOT NULL DEFAULT false,
  min_age               integer,
  accessibility         jsonb NOT NULL DEFAULT '{}',  -- las 5 dimensiones de §3.3
  -- Búsqueda
  search_vector         tsvector,
  embedding             vector(1536),
  -- Métricas calculadas
  avg_rating            numeric(3,2),
  expectation_fidelity  numeric(4,2),
  review_count          integer NOT NULL DEFAULT 0,
  booking_count         integer NOT NULL DEFAULT 0,
  published_at          timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  deleted_at            timestamptz,
  UNIQUE (organization_id, slug),
  CONSTRAINT chk_service_price CHECK (
    (pricing_mode = 'quote_only' AND base_price IS NULL) OR
    (pricing_mode <> 'quote_only' AND base_price IS NOT NULL AND base_price > 0)
  ),
  CONSTRAINT chk_service_participants CHECK (max_participants IS NULL OR max_participants >= min_participants),
  CONSTRAINT chk_service_fidelity CHECK (expectation_fidelity IS NULL OR expectation_fidelity BETWEEN -3 AND 3)
);
CREATE INDEX idx_service_org ON service(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_service_published ON service(status, category_id, city) WHERE status = 'published' AND deleted_at IS NULL;
CREATE INDEX idx_service_search ON service USING gin(search_vector);
CREATE INDEX idx_service_embedding ON service USING hnsw (embedding vector_cosine_ops);
CREATE INDEX idx_service_geo ON service(latitude, longitude) WHERE status = 'published';

-- Variantes: mismo servicio, distintas configuraciones de precio o duración
CREATE TABLE service_variant (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      uuid NOT NULL REFERENCES service(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organization(id),
  name            varchar(120) NOT NULL,
  description     text,
  price           bigint NOT NULL,
  duration_minutes integer,
  max_participants integer,
  season_from     date,
  season_until    date,
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Medios: imágenes propias y video embebido de terceros
CREATE TABLE service_media (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      uuid NOT NULL REFERENCES service(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organization(id),
  kind            varchar(20) NOT NULL,   -- image, embedded_video
  url             text NOT NULL,
  embed_provider  social_network,          -- si es video embebido
  embed_id        varchar(120),
  alt_text        varchar(280),            -- obligatorio para accesibilidad
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Colecciones: agrupaciones temáticas creadas por clientes o creadores
CREATE TABLE collection (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_account_id uuid NOT NULL REFERENCES account(id),
  slug          citext NOT NULL,
  name          varchar(160) NOT NULL,
  description   text,
  cover_url     text,
  is_public     boolean NOT NULL DEFAULT false,
  item_count    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  UNIQUE (owner_account_id, slug)
);

CREATE TABLE collection_item (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id uuid NOT NULL REFERENCES collection(id) ON DELETE CASCADE,
  service_id    uuid NOT NULL REFERENCES service(id),
  note          text,
  sort_order    integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (collection_id, service_id)
);
