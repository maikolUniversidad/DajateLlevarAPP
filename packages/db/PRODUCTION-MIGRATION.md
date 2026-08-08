# Runbook — migración a producción (descubrimiento + reseñas)

Aplica los cambios de la rama `claude/jovial-moser-3c384b` a la base de
producción (Supabase) sin romper lo que ya corre desde `main`.

## Qué introduce esta rama

- **`0016_org_rls.sql`** → RLS en `organization` y `organization_membership`.
- **`0019_reviews_products.sql`** → ejes de reseña por categoría
  (`category_review_axis`), entidad `product` (plato/combo) y reseñas de
  producto (`product_review`, `product_review_axis`); nuevos valores del enum
  `review_axis_kind`: `cleanliness`, `instagrammability`.

Todo es **aditivo** (tablas, valores de enum, políticas). No borra ni altera
columnas existentes.

## Situación de partida (leer antes de tocar nada)

1. **La rama va detrás de `main`.** `main` tiene `0014`–`0017`
   (`platform_admin`, `creator_content`, `business_extra`, `registration_extra`)
   que esta rama no. La base de producción **ya tiene** esas migraciones.
2. **Colisión de numeración.** `0016_org_rls.sql` comparte el número `0016` con
   `0016_business_extra.sql` de `main`. El migrador indexa por **nombre de
   archivo**, así que técnicamente no choca, pero por convención hay que
   **renumerar** `0016_org_rls.sql` → `0018_org_rls.sql`.
3. **Datos de configuración.** Los ejes por categoría (`category_review_axis`)
   hoy se insertan en el **seed**, no en una migración. Producción no corre el
   seed, así que sin el paso de config la ficha devolverá `axes`/`product_axes`
   vacíos. Ver Fase C.

## Fase A — Reconciliar la rama con `main`

```bash
git fetch origin main
git switch claude/jovial-moser-3c384b
git rebase origin/main            # o merge; resolver conflictos
```

Conflictos esperados (ambos lados añadieron cosas — **combinar**, no descartar):

- `packages/db/src/schema.ts` — enums y tablas nuevas de ambas ramas.
- `packages/db/src/seed.ts` — bloques de seed de ambas ramas.
- `packages/contracts/src/index.ts` — exports nuevos de ambas.
- `packages/api/src/app.ts` — rutas montadas de ambas.

Después:

```bash
git mv packages/db/migrations/0016_org_rls.sql packages/db/migrations/0018_org_rls.sql
pnpm install && pnpm typecheck && pnpm lint && pnpm test
```

Migraciones resultantes tras el merge: `0000`…`0017` (main) + `0018_org_rls` +
`0019_reviews_products`.

## Fase B — Aplicar el esquema a Supabase

1. **Cadena de conexión de migración** = *session pooler* (puerto **5432**),
   no el transaction pooler (6543). Formato en `.env.example`:
   `postgresql://postgres.[REF]:[PASSWORD]@aws-1-[REGION].pooler.supabase.com:5432/postgres?sslmode=require`
2. **Respaldo primero.** Toma un backup/branch en Supabase (o confirma que PITR
   está activo) antes de migrar.
3. **Correr solo las nuevas** (el migrador salta las ya aplicadas):

   ```bash
   DATABASE_URL_DIRECT="postgres://…pooler.supabase.com:5432/postgres?sslmode=require" pnpm db:migrate
   ```

   Debe imprimir solo `→ aplicando 0018_org_rls.sql … ok` y
   `→ aplicando 0019_reviews_products.sql … ok`.

4. **Verificación:**

   ```sql
   -- tablas nuevas
   SELECT to_regclass('public.product'), to_regclass('public.product_review'),
          to_regclass('public.product_review_axis'), to_regclass('public.category_review_axis');
   -- valores de enum nuevos
   SELECT enumlabel FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
   WHERE t.typname = 'review_axis_kind' AND enumlabel IN ('cleanliness','instagrammability');
   -- RLS activo
   SELECT relname, relrowsecurity FROM pg_class
   WHERE relname IN ('organization','organization_membership','product','product_review');
   ```

> **Nota sobre `ALTER TYPE … ADD VALUE`:** funciona dentro de la transacción del
> migrador en Postgres 16 (Supabase). Verificado en local.

> **Nota sobre RLS:** confirmar con qué rol conecta la app en producción. Si es
> `postgres` (dueño), RLS se ignora y `0018` no cambia el comportamiento (solo
> es defensa en profundidad). Con un rol restringido, validar que la app siga
> leyendo/escribiendo (usa el service role o `withAccountContext`).

## Fase C — Datos de configuración de ejes por categoría

Producción no corre `pnpm db:seed`. Corre el script idempotente
**`packages/db/scripts/prod-category-axes.sql`** en el editor SQL de Supabase
(o vía `psql`). Su contenido (ajusta los `slug` si difieren en producción):

```sql
INSERT INTO category_review_axis (category_id, scope, axis_key, label_es, sort_order)
SELECT c.id, v.scope, v.axis_key, v.label_es, v.sort_order
FROM category c
JOIN (VALUES
  ('gastronomia','venue','service_quality','Servicio',0),
  ('gastronomia','venue','cleanliness','Limpieza',1),
  ('gastronomia','venue','value_for_money','Calidad-precio',2),
  ('gastronomia','venue','instagrammability','Instagrameable',3),
  ('gastronomia','product','flavor','Sabor',0),
  ('gastronomia','product','portion','Cantidad',1),
  ('gastronomia','product','product_value','Calidad-precio',2),
  ('aventura-naturaleza','venue','service_quality','Guía y servicio',0),
  ('aventura-naturaleza','venue','punctuality','Puntualidad',1),
  ('aventura-naturaleza','venue','value_for_money','Calidad-precio',2),
  ('bienestar','venue','cleanliness','Limpieza',0),
  ('bienestar','venue','service_quality','Servicio',1),
  ('bienestar','venue','value_for_money','Calidad-precio',2)
) AS v(cat_slug, scope, axis_key, label_es, sort_order) ON c.slug = v.cat_slug
ON CONFLICT (category_id, scope, axis_key) DO NOTHING;
```

**Recomendado:** convertir este INSERT en una migración (p. ej.
`0020_category_axes_config.sql`) y quitarlo del seed, para que producción lo
reciba solo con `pnpm db:migrate`. Los datos demo (platos y reseñas de Sabor
Llanero) se quedan en el seed y **no** van a producción.

## Fase D — Desplegar y verificar

1. Fusionar el PR → `main` → Vercel despliega producción automáticamente.
2. **Confirmar que `ALLOW_DEV_AUTH` NO está definido** en el proyecto de Vercel
   (el shim de dev debe quedar apagado; además está gateado por
   `NODE_ENV !== 'production'`).
3. Smoke test de producción:
   - `GET /api/v1/categories` → lista de actividades.
   - `GET /api/v1/services/:id` → `axes`, `product_axes`, `products`,
     `rating_summary`.
   - `GET /api/v1/services/:id/reviews` y `/api/v1/products/:id/reviews`.
   - Escribir reseña → debe pedir **auth real** (el shim no aplica en prod).

## Rollback

Todo es aditivo, así que revertir es acotado:

```sql
-- 0019
DROP TABLE IF EXISTS product_review_axis, product_review, product, category_review_axis CASCADE;
-- 0018 (si RLS estorbara con rol restringido)
ALTER TABLE organization DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_membership DISABLE ROW LEVEL SECURITY;
```

Los valores de enum `cleanliness`/`instagrammability` no se pueden quitar
(`ALTER TYPE … DROP VALUE` no existe en Postgres), pero son inertes si nadie los
usa. Borra también las filas de `schema_migrations` correspondientes si vas a
reaplicar.
