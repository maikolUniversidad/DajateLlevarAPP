-- Migración 0008 — reseñas

CREATE TABLE review (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        uuid NOT NULL UNIQUE REFERENCES booking(id),
  service_id        uuid NOT NULL REFERENCES service(id),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  author_account_id uuid NOT NULL REFERENCES account(id),
  attribution_id    uuid,                                -- si vino de un creador
  status            review_status NOT NULL DEFAULT 'published',
  comment           text,
  -- Puntualidad: declarado vs real
  declared_wait_minutes integer,
  actual_wait_minutes   integer,
  -- Moderación
  flagged_reason    text,
  moderated_at      timestamptz,
  moderated_by      uuid REFERENCES account(id),
  -- Respuesta del prestador
  provider_response text,
  provider_responded_at timestamptz,
  helpful_count     integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_review_service ON review(service_id, created_at DESC) WHERE status = 'published';

-- Los cinco ejes. Uno por fila para poder agregarlos independientemente.
CREATE TABLE review_axis (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid NOT NULL REFERENCES review(id) ON DELETE CASCADE,
  kind        review_axis_kind NOT NULL,
  value       numeric(3,1) NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, kind),
  CONSTRAINT chk_axis_range CHECK (
    (kind = 'expectation_vs_reality' AND value BETWEEN -3 AND 3) OR
    (kind <> 'expectation_vs_reality' AND value BETWEEN 1 AND 5)
  )
);

-- Accesibilidad reportada por el cliente, para contrastar con lo declarado
-- DATO POTENCIALMENTE SENSIBLE: se agrega, nunca se muestra individualizado
CREATE TABLE review_accessibility_report (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id     uuid NOT NULL REFERENCES review(id) ON DELETE CASCADE,
  dimension     varchar(30) NOT NULL,                   -- mobility, visual, hearing, neurodivergent, children
  declared      varchar(10) NOT NULL,                   -- lo que dijo la empresa
  reported      varchar(10) NOT NULL,                   -- lo que encontró el cliente
  has_divergence boolean GENERATED ALWAYS AS (declared <> reported) STORED,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE review_media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid NOT NULL REFERENCES review(id) ON DELETE CASCADE,
  url         text NOT NULL,
  alt_text    varchar(280),
  created_at  timestamptz NOT NULL DEFAULT now()
);
