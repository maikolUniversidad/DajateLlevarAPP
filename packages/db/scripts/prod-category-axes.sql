-- Config de ejes de reseña por categoría para PRODUCCIÓN.
--
-- Ejecutar UNA vez tras aplicar las migraciones (0018_org_rls, 0019_reviews_products)
-- a la base de Supabase. El seed no corre en producción, así que sin esto la
-- ficha devuelve `axes`/`product_axes` vacíos.
--
-- Es idempotente (ON CONFLICT DO NOTHING): se puede correr varias veces sin
-- duplicar. Ajusta los `slug` si en producción difieren de estos.

INSERT INTO category_review_axis (category_id, scope, axis_key, label_es, sort_order)
SELECT c.id, v.scope, v.axis_key, v.label_es, v.sort_order
FROM category c
JOIN (VALUES
  -- Gastronomía — local
  ('gastronomia', 'venue', 'service_quality', 'Servicio', 0),
  ('gastronomia', 'venue', 'cleanliness', 'Limpieza', 1),
  ('gastronomia', 'venue', 'value_for_money', 'Calidad-precio', 2),
  ('gastronomia', 'venue', 'instagrammability', 'Instagrameable', 3),
  -- Gastronomía — plato
  ('gastronomia', 'product', 'flavor', 'Sabor', 0),
  ('gastronomia', 'product', 'portion', 'Cantidad', 1),
  ('gastronomia', 'product', 'product_value', 'Calidad-precio', 2),
  -- Aventura y naturaleza — local
  ('aventura-naturaleza', 'venue', 'service_quality', 'Guía y servicio', 0),
  ('aventura-naturaleza', 'venue', 'punctuality', 'Puntualidad', 1),
  ('aventura-naturaleza', 'venue', 'value_for_money', 'Calidad-precio', 2),
  -- Bienestar — local
  ('bienestar', 'venue', 'cleanliness', 'Limpieza', 0),
  ('bienestar', 'venue', 'service_quality', 'Servicio', 1),
  ('bienestar', 'venue', 'value_for_money', 'Calidad-precio', 2)
) AS v(cat_slug, scope, axis_key, label_es, sort_order) ON c.slug = v.cat_slug
ON CONFLICT (category_id, scope, axis_key) DO NOTHING;

-- Verificación:
--   SELECT c.slug, cra.scope, cra.axis_key, cra.label_es
--   FROM category_review_axis cra JOIN category c ON c.id = cra.category_id
--   ORDER BY c.slug, cra.scope, cra.sort_order;
