-- Migración 0015 — enlaces sociales y análisis de contenido de creadores (§12)
-- El creador registra enlaces públicos (entrada del scraping). La plataforma
-- raspa el contenido, transcribe videos, cuenta vistas y clasifica para derivar
-- categoría y audiencia. Métricas y categorías se CALCULAN, nunca se declaran.

-- Enums nuevos (social_network ya existe desde 0001).
DO $$ BEGIN CREATE TYPE social_link_status AS ENUM ('pending','verified','failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE social_content_kind AS ENUM ('video','short','reel','live','image','carousel','text'); EXCEPTION WHEN duplicate_object THEN null; END $$;
DO $$ BEGIN CREATE TYPE creator_analysis_status AS ENUM ('pending','running','completed','failed'); EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Enlaces de redes declarados por el creador. Idempotente por (creador, red).
CREATE TABLE creator_social_link (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  network            social_network NOT NULL,
  url                text NOT NULL,
  handle             varchar(120),
  status             social_link_status NOT NULL DEFAULT 'pending',
  last_analyzed_at   timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_profile_id, network)
);
CREATE INDEX idx_creator_social_link_creator ON creator_social_link(creator_profile_id);

-- Pieza de contenido raspada y transcrita: dato de valor por ítem.
CREATE TABLE creator_content_item (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id uuid NOT NULL REFERENCES creator_profile(id) ON DELETE CASCADE,
  social_link_id     uuid REFERENCES creator_social_link(id) ON DELETE SET NULL,
  network            social_network NOT NULL,
  kind               social_content_kind NOT NULL,
  external_id        varchar(200),
  url                text NOT NULL,
  title              text,
  views              integer NOT NULL DEFAULT 0,
  likes              integer NOT NULL DEFAULT 0,
  comments           integer NOT NULL DEFAULT 0,
  shares             integer NOT NULL DEFAULT 0,
  duration_seconds   integer,
  published_at       timestamptz,
  transcript         text,                          -- transcripción del audio/video
  language           varchar(10),
  topics             text[] NOT NULL DEFAULT '{}',
  analyzed_at        timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (creator_profile_id, network, external_id)
);
CREATE INDEX idx_creator_content_creator ON creator_content_item(creator_profile_id, published_at DESC);

-- Insight agregado derivado del análisis (categoría/audiencia calculadas).
CREATE TABLE creator_content_insight (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_profile_id   uuid NOT NULL UNIQUE REFERENCES creator_profile(id) ON DELETE CASCADE,
  status               creator_analysis_status NOT NULL DEFAULT 'pending',
  items_analyzed       integer NOT NULL DEFAULT 0,
  total_views          bigint NOT NULL DEFAULT 0,
  avg_views            numeric(12,2) NOT NULL DEFAULT 0,
  avg_engagement_rate  numeric(5,4),
  suggested_categories text[] NOT NULL DEFAULT '{}',
  top_topics           text[] NOT NULL DEFAULT '{}',
  audience             jsonb NOT NULL DEFAULT '{}',   -- rango de edad, ciudades, idiomas, intereses
  brand_safety         varchar(10) NOT NULL DEFAULT 'review',
  networks             jsonb NOT NULL DEFAULT '[]',   -- resumen por red: followers, vistas, piezas
  analyzed_at          timestamptz,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- RLS: acceso por cuenta a través del perfil de creador (§5).
ALTER TABLE creator_social_link ENABLE ROW LEVEL SECURITY;
CREATE POLICY creator_social_link_account_access ON creator_social_link
  FOR ALL
  USING (
    creator_profile_id IN (
      SELECT id FROM creator_profile
      WHERE account_id = current_setting('app.current_account_id', true)::uuid
    )
  );

ALTER TABLE creator_content_item ENABLE ROW LEVEL SECURITY;
CREATE POLICY creator_content_item_account_access ON creator_content_item
  FOR ALL
  USING (
    creator_profile_id IN (
      SELECT id FROM creator_profile
      WHERE account_id = current_setting('app.current_account_id', true)::uuid
    )
  );

ALTER TABLE creator_content_insight ENABLE ROW LEVEL SECURITY;
CREATE POLICY creator_content_insight_account_access ON creator_content_insight
  FOR ALL
  USING (
    creator_profile_id IN (
      SELECT id FROM creator_profile
      WHERE account_id = current_setting('app.current_account_id', true)::uuid
    )
  );
