-- Migración 0019 — ejes de reseña por categoría + productos (platos/combos)
--
-- Extiende el modelo de reseñas para que:
--   1) cada CATEGORÍA defina qué ejes se califican (multi-rubro: un restaurante
--      califica sabor/limpieza/instagrameable; una cancha de tiro, seguridad),
--   2) existan PRODUCTOS (platos/combos) bajo un servicio, con reseñas propias
--      cuyos ejes (sabor, cantidad, calidad-precio…) son texto libre para poder
--      crecer sin migración ("y demás").
--
-- Ojo numeración: el árbol principal ya tiene 0014–0017 sin fusionar; esta va
-- como 0019 para no colisionar. Depende de tablas de 0002–0008 y de
-- current_user_organizations() (0013).

-- Nuevos ejes de LOCAL en el enum existente (escala 1..5: encajan en el CHECK
-- de review_axis para kind <> 'expectation_vs_reality').
ALTER TYPE review_axis_kind ADD VALUE IF NOT EXISTS 'cleanliness';
ALTER TYPE review_axis_kind ADD VALUE IF NOT EXISTS 'instagrammability';

-- =====================================================================
-- Config de ejes por categoría
-- =====================================================================
-- scope='venue'  → eje del servicio/local; axis_key coincide con review_axis_kind.
-- scope='product'→ eje de un plato/combo; axis_key es libre (flavor, portion,
--                  product_value, …) y casa con product_review_axis.axis_key.
CREATE TABLE category_review_axis (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id  uuid NOT NULL REFERENCES category(id) ON DELETE CASCADE,
  scope        varchar(10) NOT NULL,
  axis_key     varchar(40) NOT NULL,
  label_es     varchar(60) NOT NULL,
  value_scale  varchar(10) NOT NULL DEFAULT '1_5',
  sort_order   integer NOT NULL DEFAULT 0,
  is_active    boolean NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, scope, axis_key),
  CONSTRAINT chk_cra_scope CHECK (scope IN ('venue', 'product')),
  CONSTRAINT chk_cra_scale CHECK (value_scale IN ('1_5', 'neg3_3'))
);
CREATE INDEX idx_cra_category ON category_review_axis(category_id, scope, sort_order)
  WHERE is_active;

-- =====================================================================
-- Producto (plato / combo) dentro de un servicio
-- =====================================================================
CREATE TABLE product (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      uuid NOT NULL REFERENCES service(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organization(id),
  name            varchar(140) NOT NULL,
  description     text,
  price           bigint,                        -- centavos; null = sin precio fijo
  currency        char(3) NOT NULL DEFAULT 'COP',
  image_url       text,
  is_combo        boolean NOT NULL DEFAULT false,
  is_active       boolean NOT NULL DEFAULT true,
  sort_order      integer NOT NULL DEFAULT 0,
  -- Métricas calculadas de product_review
  avg_rating      numeric(3,2),
  review_count    integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  deleted_at      timestamptz,
  CONSTRAINT chk_product_price CHECK (price IS NULL OR price >= 0)
);
CREATE INDEX idx_product_service ON product(service_id, sort_order) WHERE deleted_at IS NULL;

-- Reseña de un producto. NO atada a reserva: se puede opinar de un plato.
-- Una por persona y producto.
CREATE TABLE product_review (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id        uuid NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  service_id        uuid NOT NULL REFERENCES service(id),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  author_account_id uuid NOT NULL REFERENCES account(id),
  status            review_status NOT NULL DEFAULT 'published',
  comment           text,
  helpful_count     integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, author_account_id)
);
CREATE INDEX idx_product_review ON product_review(product_id, created_at DESC)
  WHERE status = 'published';

-- Ejes de la reseña de producto. axis_key libre (extensible sin migración).
CREATE TABLE product_review_axis (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid NOT NULL REFERENCES product_review(id) ON DELETE CASCADE,
  axis_key    varchar(40) NOT NULL,
  value       numeric(3,1) NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, axis_key),
  CONSTRAINT chk_pra_value CHECK (value BETWEEN 1 AND 5)
);

-- =====================================================================
-- RLS — consistente con 0013 (la app conecta como propietario; esto es
-- defensa en profundidad para roles restringidos).
-- =====================================================================
ALTER TABLE category_review_axis ENABLE ROW LEVEL SECURITY;
CREATE POLICY category_review_axis_public_read ON category_review_axis
  FOR SELECT USING (is_active);

ALTER TABLE product ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_public_read ON product
  FOR SELECT USING (deleted_at IS NULL AND is_active);
CREATE POLICY product_org_manage ON product
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()))
  WITH CHECK (organization_id IN (SELECT current_user_organizations()));

ALTER TABLE product_review ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_review_public_read ON product_review
  FOR SELECT USING (status = 'published');
CREATE POLICY product_review_author_manage ON product_review
  FOR ALL
  USING (author_account_id = current_setting('app.current_account_id', true)::uuid)
  WITH CHECK (author_account_id = current_setting('app.current_account_id', true)::uuid);

ALTER TABLE product_review_axis ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_review_axis_public_read ON product_review_axis
  FOR SELECT USING (true);
