# DÉJATELLEVAR
## Especificación Técnica de Construcción
### Sistema de diseño · Modelo de datos completo · Inventario total de vistas · Mapa de API · Prompt maestro

---

**Versión:** 1.0
**Documento complementario de:** *DéjateLlevar — Documento Maestro Consolidado v3.0*
**Propósito:** ser el insumo técnico que se entrega a Claude Code para construir la aplicación

---

## Cómo usar este documento

Este documento no reemplaza al Documento Maestro Consolidado: lo complementa. El primero explica **qué** se construye y **por qué**; este explica **cómo se ve** y **cómo se estructura**.

**Entrega a Claude Code los dos documentos juntos**, en este orden:

1. `DejateLlevar_Documento_Consolidado.md` → contexto de negocio, reglas de dominio, cumplimiento legal
2. `DejateLlevar_Especificacion_Tecnica.md` (este) → sistema de diseño, esquema completo, vistas, API
3. El prompt maestro de la §9 de este documento

Colócalos en la raíz del repositorio dentro de una carpeta `docs/` antes de la primera sesión. Así Claude puede consultarlos con `@docs/...` cuando lo necesite, sin que tengas que repetir el contexto.

```
dejatellevar/
├── docs/
│   ├── 00-documento-consolidado.md      ← el maestro
│   └── 01-especificacion-tecnica.md     ← este
├── CLAUDE.md
├── .claudeignore
└── .gitignore
```

### Índice

1. [Sistema de diseño e identidad visual](#1-sistema-de-diseño-e-identidad-visual)
2. [Convenciones técnicas transversales](#2-convenciones-técnicas-transversales)
3. [Enumeraciones y catálogos](#3-enumeraciones-y-catálogos)
4. [Modelo de datos completo](#4-modelo-de-datos-completo)
5. [Seguridad a nivel de fila (RLS)](#5-seguridad-a-nivel-de-fila-rls)
6. [Datos semilla iniciales](#6-datos-semilla-iniciales)
7. [Inventario total de vistas](#7-inventario-total-de-vistas)
8. [Mapa de API](#8-mapa-de-api)
9. [Prompt maestro para Claude Code](#9-prompt-maestro-para-claude-code)
10. [Prompts de continuación por módulo](#10-prompts-de-continuación-por-módulo)

---

## 1. Sistema de diseño e identidad visual

### 1.1 Dirección de diseño

**El sujeto es el Llano.** Villavicencio es la puerta entre la cordillera y la llanura: horizontes largos, luz baja, ríos anchos, y una cultura de trabajo al aire libre. Pero DéjateLlevar no es una postal turística: es una herramienta donde alguien cobra, agenda y firma contratos. La identidad tiene que sostener las dos cosas.

**Concepto rector: HORIZONTE AL ATARDECER.** El producto se organiza en bandas horizontales anchas y generosas, no en cuadrículas apretadas de tarjetas. La información importante ocupa el ancho completo. El espacio negativo hace el trabajo que en otros productos hacen los bordes. La marca toma el color del cielo del Llano cuando cae la tarde: violetas e índigos profundos sobre papel frío, con cabeceras de degradado y borde inferior curvo.

**Lo que este diseño evita deliberadamente:** el fondo crema con serif de alto contraste y acento terracota, el fondo casi negro con un solo acento neón, y la retícula tipo periódico con filas capilares. Son las tres direcciones a las que todo producto nuevo tiende por inercia, y ninguna dice nada sobre este proyecto en particular.

### 1.2 Paleta

Valores nombrados de la marca. El eje violeta es la identidad; el eje rojo↔verde de estado es afordancia funcional, no decoración.

```css
/* Superficies y texto (neutros fríos, tinte violeta) */
--paja:      #F6F5FA;   /* fondo base — papel casi blanco con tinte lila */
--niebla:    #E8E6F0;   /* superficie elevada, bordes suaves */
--carbon:    #191427;   /* texto principal, casi negro con violeta */
--humo:      #625C74;   /* texto secundario, metadatos */

/* Marca */
--noche:     #2E2A5E;   /* índigo profundo — encabezados, superficies oscuras */
--violeta:   #7C3AED;   /* violeta — acción primaria, enlaces, foco */
--lila:      #A78BFA;   /* lila claro — acento, destacados, insignias */

/* Estados (funcionales, no marca) */
--tinto:     #8C2F39;   /* error, destructivo, fidelidad negativa */
--brote:     #3F8F5C;   /* éxito, confirmado, fidelidad positiva */
--barro:     #B5651D;   /* advertencia, pendiente, atención */
```

**Reglas de uso:**
- `--violeta` es el único color de acción primaria. Un botón primario por pantalla.
- `--lila` se usa con restricción extrema: destacar un dato, no decorar una sección.
- Botones y campos son tipo píldora; las cabeceras usan degradado `--violeta`→`--noche` con borde inferior curvo.
- La escala de fidelidad conserva `--tinto` → `--humo` → `--brote` como gradiente semántico: el eje malo↔bueno debe leerse por color universal, sin importar la marca.
- Modo oscuro: `--noche` como base, `--paja` como texto, el resto se invierte proporcionalmente.

### 1.3 Tipografía

Tres roles, tres familias. Todas de código abierto y disponibles en Google Fonts, con buen soporte de diacríticos del español.

| Rol | Familia | Uso |
|---|---|---|
| **Display** | **Bricolage Grotesque** | Títulos de página, cifras grandes, el medidor de fidelidad. Es una grotesca variable con anchos ópticos: tiene carácter sin volverse decorativa |
| **Cuerpo** | **IBM Plex Sans** | Todo el texto de interfaz, descripciones, formularios. Excelente legibilidad en tamaños pequeños y diacríticos bien resueltos |
| **Datos** | **IBM Plex Mono** | Dinero, códigos de reserva, identificadores, tarifas, números de contrato. Todo lo que se compara verticalmente |

**Regla dura:** todo monto de dinero se renderiza en IBM Plex Mono con cifras tabulares (`font-variant-numeric: tabular-nums`). En una tabla de liquidaciones, los pesos tienen que alinearse.

**Escala tipográfica** (base 16px, razón 1.25):

```css
--text-xs:   0.75rem;   /* 12px — metadatos, etiquetas */
--text-sm:   0.875rem;  /* 14px — texto secundario */
--text-base: 1rem;      /* 16px — cuerpo */
--text-lg:   1.25rem;   /* 20px — subtítulos */
--text-xl:   1.563rem;  /* 25px — títulos de sección */
--text-2xl:  1.953rem;  /* 31px — títulos de página */
--text-3xl:  2.441rem;  /* 39px — cifras destacadas */
--text-4xl:  3.052rem;  /* 49px — solo en la portada pública */
```

### 1.4 Espaciado, radios y bordes

```css
/* Escala de 4px */
--space-1: 0.25rem;  --space-2: 0.5rem;   --space-3: 0.75rem;
--space-4: 1rem;     --space-6: 1.5rem;   --space-8: 2rem;
--space-12: 3rem;    --space-16: 4rem;    --space-24: 6rem;

/* Radios — contenidos, no redondeados de más */
--radius-sm: 4px;    /* etiquetas, insignias */
--radius-md: 6px;    /* botones, campos, tarjetas */
--radius-lg: 10px;   /* modales, paneles */
--radius-full: 9999px; /* solo avatares */

/* Bordes */
--border: 1px solid var(--niebla);
--border-strong: 1px solid #C9CFC7;
```

**Sombras:** casi ninguna. La elevación se comunica con superficie y borde, no con desenfoque. Solo el menú desplegable y el modal llevan sombra:

```css
--shadow-pop: 0 4px 16px rgba(22, 33, 30, 0.10);
--shadow-modal: 0 12px 40px rgba(22, 33, 30, 0.18);
```

### 1.5 El elemento firma: el Medidor de Fidelidad

Este es el único lugar donde el diseño se permite ser memorable. Aparece en la ficha de servicio, en el perfil del creador, en el reporte de campaña y en el formulario de reseña.

Es una **barra horizontal de −3 a +3** con el cero marcado, donde la posición del indicador dice de un vistazo si el servicio entrega lo que promete:

```
Prometió menos                    Cumplió                    Prometió de más
     de lo que dio                exacto                       de lo que dio
  −3      −2      −1        0        +1      +2      +3
  ├───────┼───────┼─────────█─────────┼───────┼───────┤
                          +0.4
                    "Cumple lo que promete"
```

**Especificación:**
- Ancho completo del contenedor. Alto: 44px con etiquetas, 8px en su variante compacta.
- Gradiente de `--tinto` (−3) a `--humo` (0) a `--brote` (+3). No es rojo-verde de semáforo: el extremo positivo también se lee con matiz, porque prometer de menos también es información.
- El indicador es una barra vertical sólida de 3px en `--carbon`, no un círculo. Precisión, no juguete.
- La etiqueta textual bajo el valor cambia según el rango: *"Muy por debajo de lo prometido"*, *"Algo por debajo"*, *"Cumple lo que promete"*, *"Supera lo prometido"*.
- Con menos de 5 reseñas muestra estado vacío honesto: *"Aún sin datos suficientes"*. Nunca inventa un número.
- Versión accesible: además del color, el valor numérico y la etiqueta textual siempre visibles. `role="meter"` con `aria-valuenow`, `aria-valuemin="-3"`, `aria-valuemax="3"` y `aria-valuetext` con la etiqueta.

### 1.6 Componentes base

Inventario mínimo que debe existir en `packages/ui` antes de construir vistas:

**Primitivos:** `Button` (primario, secundario, fantasma, destructivo · sm/md/lg) · `Input` · `Textarea` · `Select` · `Combobox` · `Checkbox` · `RadioGroup` · `Switch` · `DatePicker` · `TimePicker` · `DateRangePicker` · `FileUpload` · `Avatar` · `Badge` · `Tag` · `Tooltip` · `Popover` · `Dropdown` · `Modal` · `Drawer` · `Toast` · `Tabs` · `Accordion` · `Breadcrumb` · `Pagination` · `Skeleton` · `Spinner` · `EmptyState` · `ErrorState`

**De dominio:**

| Componente | Qué muestra |
|---|---|
| `MoneyDisplay` | Monto en COP con formato local, mono tabular. Recibe centavos, nunca decimales |
| `FidelityMeter` | El elemento firma (§1.5) |
| `RatingAxes` | Los cinco ejes de reseña con sus valores |
| `ServiceCard` | Tarjeta de servicio: medio, nombre, precio desde, fidelidad compacta, accesibilidad |
| `AvailabilityCalendar` | Calendario de slots con estados |
| `BookingStatusChip` | Estado de reserva con color semántico |
| `CreatorCard` | Creador con audiencia verificada, conversión y fidelidad |
| `AudienceChart` | Demografía del creador |
| `AccessibilityBadges` | Iconos de las cinco dimensiones de accesibilidad |
| `LedgerTable` | Tabla de asientos contables con debe/haber alineados |
| `AttributionBadge` | Marca de qué creador originó una reserva |
| `VerificationLevel` | Indicador de nivel 0-5 con lo que falta para el siguiente |
| `CampaignTimeline` | Las 12 etapas de una campaña con la actual destacada |
| `RiskNotice` | Aviso de categoría de riesgo con póliza y exención |
| `AIDisclosure` | Etiqueta obligatoria en todo contenido generado por IA |

### 1.7 Piso de calidad no negociable

Toda vista, sin excepción:

- **Responsiva** desde 360px hasta 1920px. Móvil primero en la web pública, escritorio primero en los paneles.
- **Foco visible** en todo elemento interactivo: anillo de 2px en `--violeta` con desplazamiento de 2px.
- **Contraste AA mínimo** (4.5:1 en texto normal, 3:1 en texto grande). Verificado, no supuesto.
- **`prefers-reduced-motion` respetado**: sin animaciones de entrada si está activo.
- **Estados completos**: toda vista tiene diseño de carga, vacío, error y sin permisos. Un estado vacío es una invitación a actuar, no una disculpa.
- **Objetivos táctiles de 44×44px mínimo** en móvil.
- **Navegación por teclado completa** en todos los flujos transaccionales.
- **Textos en español de Colombia**, sentence case, voz activa. Un botón dice exactamente qué pasa: "Confirmar reserva", no "Enviar".

### 1.8 Voz de la interfaz

| Situación | Cómo se escribe |
|---|---|
| Acción | Verbo en infinitivo, específico: "Publicar servicio", no "Guardar" |
| Confirmación | El mismo verbo en participio: "Servicio publicado" |
| Error | Qué pasó y cómo se arregla, sin disculpas: "El RNT no está vigente. Actualízalo en Configuración para publicar." |
| Vacío | Invitación con acción: "Todavía no tienes servicios. Publica el primero y aparecerás en el marketplace." |
| Dinero | Siempre con moneda explícita: "$ 85.000 COP" |
| Fechas | Formato colombiano: "mar 12 de agosto, 3:00 p. m." |

---

## 2. Convenciones técnicas transversales

### 2.1 Nomenclatura

| Elemento | Convención | Ejemplo |
|---|---|---|
| Tablas | `snake_case`, singular, inglés | `booking`, `ledger_entry` |
| Columnas | `snake_case`, inglés | `organization_id`, `created_at` |
| Claves foráneas | `<tabla>_id` | `service_id` |
| Índices | `idx_<tabla>_<columnas>` | `idx_booking_org_starts_at` |
| Restricciones | `chk_<tabla>_<regla>` | `chk_review_expectation_range` |
| Enumeraciones PG | `snake_case` singular | `booking_status` |
| Archivos TS | `kebab-case.ts` | `create-booking.ts` |
| Componentes React | `PascalCase.tsx` | `FidelityMeter.tsx` |
| Textos de usuario | Español de Colombia | — |

### 2.2 Columnas estándar en toda tabla

```sql
id            uuid         PRIMARY KEY DEFAULT uuid_generate_v7()
created_at    timestamptz  NOT NULL DEFAULT now()
updated_at    timestamptz  NOT NULL DEFAULT now()
deleted_at    timestamptz  NULL        -- baja lógica, nunca DELETE físico
```

Excepciones: `domain_event` y `ledger_entry` **no tienen** `updated_at` ni `deleted_at`. Son append-only por diseño.

### 2.3 Tipos de dominio

| Concepto | Tipo en PostgreSQL | Razón |
|---|---|---|
| **Dinero** | `bigint` en centavos + columna `currency char(3)` | Nunca punto flotante. `85000` COP se guarda como `8500000` |
| **Fecha y hora** | `timestamptz` siempre | Almacenamiento en UTC, presentación en `America/Bogota` |
| **Fecha sin hora** | `date` | Cumpleaños, vigencias |
| **Duración** | `integer` en minutos | Simple y suficiente |
| **Porcentaje** | `numeric(5,4)` | `0.1250` = 12,5%. Nunca `12.5` |
| **Coordenadas** | `numeric(9,6)` lat / `numeric(9,6)` lng | Precisión suficiente, sin dependencia de PostGIS al inicio |
| **Texto libre largo** | `text` | Sin límites artificiales |
| **JSON estructurado** | `jsonb` | Solo para datos genuinamente variables (metadatos de proveedor, payload de evento) |
| **Vector semántico** | `vector(1536)` (pgvector) | Embeddings del catálogo |

### 2.4 Extensiones de PostgreSQL requeridas

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";      -- gen_random_uuid, cifrado
CREATE EXTENSION IF NOT EXISTS "pg_trgm";       -- búsqueda por similitud de texto
CREATE EXTENSION IF NOT EXISTS "unaccent";      -- búsqueda sin tildes
CREATE EXTENSION IF NOT EXISTS "vector";        -- pgvector, búsqueda semántica
CREATE EXTENSION IF NOT EXISTS "btree_gist";    -- restricciones de exclusión de rangos
```

`btree_gist` es la que permite la restricción de exclusión que **hace imposible la doble reserva a nivel de base de datos**, no solo a nivel de aplicación. Es la defensa más importante del modelo de reservas.

### 2.5 Reglas de integridad

1. **Toda tabla multi-inquilino lleva `organization_id`** con índice, aunque parezca redundante. La desnormalización aquí es deliberada: permite RLS simple y consultas rápidas.
2. **Ninguna clave foránea usa `ON DELETE CASCADE`** salvo en tablas hijas puras (variantes, ejes de reseña). La baja es lógica.
3. **Toda restricción de negocio expresable en SQL se expresa en SQL.** Si el rango de la fidelidad es −3 a +3, hay un `CHECK`. La validación de aplicación no sustituye a la de base de datos.
4. **Índices desde el diseño**, no después del incidente de rendimiento.

---

## 3. Enumeraciones y catálogos

### 3.1 Enumeraciones de PostgreSQL

```sql
-- Identidad y cuentas
CREATE TYPE profile_type AS ENUM ('client', 'creator', 'business', 'agency');
CREATE TYPE verification_level AS ENUM ('l0_email','l1_phone','l2_document','l3_tax_id','l4_tourism','l5_insurance');
CREATE TYPE membership_role AS ENUM ('owner','admin','staff','viewer');

-- Catálogo
CREATE TYPE service_modality AS ENUM ('scheduled','capacity','on_demand','digital');
CREATE TYPE service_status AS ENUM ('draft','pending_review','published','paused','archived');
CREATE TYPE pricing_mode AS ENUM ('fixed','from','quote_only');
CREATE TYPE location_mode AS ENUM ('on_site','at_client','remote','hybrid');
CREATE TYPE risk_category AS ENUM ('none','moderate','high');

-- Reservas
CREATE TYPE booking_status AS ENUM ('draft','pending_payment','pending_confirmation','confirmed','in_progress','completed','cancelled_by_client','cancelled_by_provider','no_show','expired');
CREATE TYPE quote_status AS ENUM ('requested','answered','negotiating','accepted','rejected','expired');
CREATE TYPE cancellation_policy AS ENUM ('flexible','moderate','strict','non_refundable');

-- Pagos
CREATE TYPE payment_status AS ENUM ('created','authorized','held','released','refunded','partially_refunded','failed','reversed');
CREATE TYPE payment_method AS ENUM ('card','pse','nequi','daviplata','bancolombia','bre_b','cash','wallet_credit');
CREATE TYPE ledger_side AS ENUM ('debit','credit');
CREATE TYPE ledger_account AS ENUM ('client_funds','platform_revenue','provider_payable','creator_payable','tax_withholding','vat_payable','escrow_held','refund_issued','gateway_fee');
CREATE TYPE payout_status AS ENUM ('requested','processing','completed','failed','cancelled');

-- Reseñas
CREATE TYPE review_status AS ENUM ('published','flagged','hidden','removed');
CREATE TYPE review_axis_kind AS ENUM ('expectation_vs_reality','service_quality','punctuality','accessibility','value_for_money');

-- Campañas
CREATE TYPE campaign_status AS ENUM ('draft','open','matching','negotiating','contracted','in_production','in_review','published','completed','cancelled','disputed');
CREATE TYPE campaign_model AS ENUM ('affiliate','fixed_fee','hybrid');
CREATE TYPE application_status AS ENUM ('submitted','shortlisted','rejected','accepted','withdrawn');
CREATE TYPE deliverable_status AS ENUM ('pending','submitted','changes_requested','approved','auto_approved','rejected');
CREATE TYPE social_network AS ENUM ('tiktok','instagram','youtube','facebook','x','twitch');

-- Atribución
CREATE TYPE attribution_mechanism AS ENUM ('tracked_link','creator_code','deep_link','post_survey','view_through');
CREATE TYPE attribution_model AS ENUM ('last_non_direct','first_touch','linear','position_based');

-- Confianza
CREATE TYPE dispute_status AS ENUM ('open','evidence_requested','under_review','resolved_client','resolved_provider','resolved_split','withdrawn');
CREATE TYPE fraud_signal_kind AS ENUM ('fake_review','duplicate_account','collusion','audience_inflation','payment_laundering','attribution_fraud');

-- Interoperabilidad
CREATE TYPE connector_kind AS ENUM ('calendar','crm','accounting','social','payment','messaging','ota_channel','storage','mcp_server');
CREATE TYPE sync_direction AS ENUM ('inbound','outbound','bidirectional');
CREATE TYPE sync_status AS ENUM ('ok','degraded','failed','revoked');

-- Cumplimiento
CREATE TYPE consent_purpose AS ENUM ('terms','privacy','marketing','sensitive_accessibility','ai_processing','data_sharing');
```

### 3.2 Taxonomía de categorías

Estructura de dos niveles. Se carga como datos semilla, no como enumeración, porque debe poder crecer sin migración.

| Categoría | Subcategorías |
|---|---|
| **Gastronomía** | Restaurantes · Experiencias culinarias · Catas y maridajes · Clases de cocina · Food tours · Catering |
| **Aventura y naturaleza** | Senderismo · Rafting y deportes acuáticos · Ciclomontañismo · Avistamiento de aves · Camping · Cabalgatas · Parapente |
| **Bienestar** | Masajes · Spa · Yoga y meditación · Terapias alternativas · Nutrición |
| **Belleza** | Peluquería · Barbería · Manicure y pedicure · Maquillaje · Estética · Depilación |
| **Deporte y fitness** | Entrenamiento personal · Clases grupales · Deportes de equipo · Natación · Artes marciales |
| **Cultura y entretenimiento** | Tours culturales · Museos y patrimonio · Música en vivo · Talleres artísticos · Teatro |
| **Turismo llanero** | Fincas y hatos · Coleo y tradición · Amanecer llanero · Rutas del Ariari · Caño Cristales |
| **Formación** | Cursos presenciales · Cursos en línea · Asesorías · Talleres · Idiomas |
| **Servicios profesionales** | Fotografía · Video · Diseño · Consultoría · Legal · Contable |
| **Eventos** | Organización · Decoración · Sonido e iluminación · Animación · Alquiler de espacios |
| **Hogar y mascotas** | Limpieza · Reparaciones · Jardinería · Paseo y guardería de mascotas · Veterinaria |
| **Transporte y traslados** | Traslados aeropuerto · Alquiler de vehículos · Tours con conductor |

**Categorías marcadas como riesgo alto** (requieren póliza, §4.4): Rafting y deportes acuáticos, Parapente, Cabalgatas, Ciclomontañismo, Camping, Artes marciales, Transporte y traslados.

### 3.3 Dimensiones de accesibilidad

Cinco dimensiones, cada una con tres estados: `yes`, `partial`, `no`.

| Clave | Etiqueta en español | Qué significa |
|---|---|---|
| `mobility` | Movilidad reducida | Acceso sin escalones, baño adaptado, espacio de maniobra |
| `visual` | Apoyo visual | Señalización en braille, audiodescripción, permite perro guía |
| `hearing` | Apoyo auditivo | Interpretación, subtítulos, personal con nociones de lengua de señas |
| `neurodivergent` | Apto neurodivergencia | Espacio de baja estimulación, horarios sin aglomeración, anticipación del plan |
| `children` | Apto menores | Instalaciones seguras, actividades adaptadas, edad mínima declarada |

Se declara por la empresa y se contrasta con lo reportado por las reseñas. Cuando hay divergencia, se emite `accessibility_divergence.detected`.

---

## 4. Modelo de datos completo

### 4.1 Identidad y organizaciones

```sql
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
```

### 4.2 Cumplimiento y consentimiento

```sql
-- Versiones de política, necesarias para probar qué aceptó cada quien
CREATE TABLE policy_version (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purpose       consent_purpose NOT NULL,
  version       varchar(20) NOT NULL,
  content_url   text NOT NULL,
  content_hash  varchar(64) NOT NULL,
  effective_from timestamptz NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (purpose, version)
);

-- Consentimiento: requisito de la Ley 1581 de 2012. Un booleano NO es prueba suficiente.
CREATE TABLE consent (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id        uuid NOT NULL REFERENCES account(id),
  policy_version_id uuid NOT NULL REFERENCES policy_version(id),
  purpose           consent_purpose NOT NULL,
  granted           boolean NOT NULL,
  granted_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at        timestamptz,
  ip_address        inet,
  user_agent        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_consent_account_purpose ON consent(account_id, purpose, granted_at DESC);

-- Solicitudes de derechos del titular (acceso, rectificación, supresión)
CREATE TABLE data_subject_request (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id    uuid NOT NULL REFERENCES account(id),
  kind          varchar(30) NOT NULL,     -- export, delete, rectify
  status        varchar(30) NOT NULL DEFAULT 'received',
  requested_at  timestamptz NOT NULL DEFAULT now(),
  resolved_at   timestamptz,
  result_url    text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
```

### 4.3 Catálogo de servicios

```sql
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
```

### 4.4 Agenda y disponibilidad

```sql
-- Recursos consumibles: personas, salas, equipos, vehículos
CREATE TABLE resource (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  name            varchar(120) NOT NULL,
  kind            varchar(30) NOT NULL,   -- staff, room, equipment, vehicle
  capacity        integer NOT NULL DEFAULT 1,
  account_id      uuid REFERENCES account(id),  -- si el recurso es una persona con cuenta
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Qué recursos consume un servicio
CREATE TABLE service_resource (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id   uuid NOT NULL REFERENCES service(id) ON DELETE CASCADE,
  resource_id  uuid NOT NULL REFERENCES resource(id),
  quantity     integer NOT NULL DEFAULT 1,
  UNIQUE (service_id, resource_id)
);

-- Reglas de horario base por día de semana
CREATE TABLE availability_rule (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  service_id      uuid REFERENCES service(id),      -- NULL = aplica a toda la organización
  resource_id     uuid REFERENCES resource(id),
  weekday         smallint NOT NULL,                 -- 0=domingo .. 6=sábado
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  slot_minutes    integer,
  valid_from      date,
  valid_until     date,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_rule_weekday CHECK (weekday BETWEEN 0 AND 6),
  CONSTRAINT chk_rule_time CHECK (end_time > start_time)
);

-- Excepciones: bloqueos, festivos, cierres puntuales
CREATE TABLE availability_exception (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  service_id      uuid REFERENCES service(id),
  resource_id     uuid REFERENCES resource(id),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  is_blocking     boolean NOT NULL DEFAULT true,     -- false = disponibilidad extraordinaria
  reason          varchar(200),
  external_event_id varchar(200),                    -- si vino de Google Calendar u otro
  connector_id    uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_exception_range CHECK (ends_at > starts_at)
);
CREATE INDEX idx_exception_range ON availability_exception(organization_id, starts_at, ends_at);

-- Sesiones con cupo: para la modalidad 'capacity'
CREATE TABLE capacity_session (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      uuid NOT NULL REFERENCES service(id),
  organization_id uuid NOT NULL REFERENCES organization(id),
  starts_at       timestamptz NOT NULL,
  ends_at         timestamptz NOT NULL,
  total_capacity  integer NOT NULL,
  booked_count    integer NOT NULL DEFAULT 0,
  price_override  bigint,
  is_cancelled    boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_session_capacity CHECK (booked_count <= total_capacity),
  CONSTRAINT chk_session_range CHECK (ends_at > starts_at)
);
CREATE INDEX idx_session_service_time ON capacity_session(service_id, starts_at);

-- Lista de espera
CREATE TABLE waitlist_entry (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id          uuid NOT NULL REFERENCES service(id),
  capacity_session_id uuid REFERENCES capacity_session(id),
  account_id          uuid NOT NULL REFERENCES account(id),
  participants        integer NOT NULL DEFAULT 1,
  notified_at         timestamptz,
  converted_booking_id uuid,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Token para el feed iCalendar de solo lectura
CREATE TABLE calendar_feed_token (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  resource_id     uuid REFERENCES resource(id),
  token           varchar(64) NOT NULL UNIQUE,
  last_accessed_at timestamptz,
  revoked_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
```

### 4.5 Reservas y cotizaciones

```sql
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
```

### 4.6 Pagos y ledger

```sql
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
```

### 4.7 Reseñas

```sql
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
```

### 4.8 Campañas, creadores y atribución

```sql
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
```

### 4.9 CRM y mensajería

```sql
CREATE TABLE crm_contact (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  account_id        uuid REFERENCES account(id),         -- si tiene cuenta en la plataforma
  full_name         varchar(160) NOT NULL,
  email             citext,
  phone             varchar(20),
  whatsapp          varchar(20),
  tags              text[] NOT NULL DEFAULT '{}',
  source            varchar(40),                         -- direct, creator, ota, import, api
  source_creator_id uuid REFERENCES creator_profile(id),
  -- Métricas calculadas
  total_bookings    integer NOT NULL DEFAULT 0,
  total_spent       bigint NOT NULL DEFAULT 0,
  last_booking_at   timestamptz,
  first_booking_at  timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  deleted_at        timestamptz
);
CREATE INDEX idx_crm_org ON crm_contact(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_crm_tags ON crm_contact USING gin(tags);

CREATE TABLE crm_note (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id    uuid NOT NULL REFERENCES crm_contact(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organization(id),
  author_account_id uuid NOT NULL REFERENCES account(id),
  body          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE crm_segment (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organization(id),
  name            varchar(120) NOT NULL,
  definition      jsonb NOT NULL,                        -- reglas del segmento dinámico
  contact_count   integer NOT NULL DEFAULT 0,
  last_computed_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Mensajería unificada
CREATE TABLE conversation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id),
  kind              varchar(30) NOT NULL,                -- client_provider, org_creator, support
  subject           varchar(200),
  booking_id        uuid REFERENCES booking(id),
  campaign_id       uuid REFERENCES campaign(id),
  quote_request_id  uuid REFERENCES quote_request(id),
  last_message_at   timestamptz,
  is_archived       boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participant (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  account_id      uuid NOT NULL REFERENCES account(id),
  last_read_at    timestamptz,
  UNIQUE (conversation_id, account_id)
);

CREATE TABLE message (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversation(id) ON DELETE CASCADE,
  sender_account_id uuid REFERENCES account(id),         -- NULL = sistema
  body            text NOT NULL,
  is_ai_generated boolean NOT NULL DEFAULT false,
  external_channel varchar(30),                          -- whatsapp, email
  external_id     varchar(160),
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_message_conversation ON message(conversation_id, created_at DESC);

CREATE TABLE message_attachment (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  uuid NOT NULL REFERENCES message(id) ON DELETE CASCADE,
  url         text NOT NULL,
  filename    varchar(200),
  mime_type   varchar(100),
  size_bytes  bigint,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notification (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id  uuid NOT NULL REFERENCES account(id),
  kind        varchar(60) NOT NULL,
  title       varchar(200) NOT NULL,
  body        text,
  action_url  text,
  channels    text[] NOT NULL DEFAULT '{in_app}',        -- in_app, email, whatsapp, push
  read_at     timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notification_account ON notification(account_id, created_at DESC) WHERE read_at IS NULL;
```

### 4.10 Confianza, disputas y auditoría

```sql
CREATE TABLE dispute (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id        uuid REFERENCES booking(id),
  campaign_contract_id uuid REFERENCES campaign_contract(id),
  attribution_id    uuid REFERENCES attribution(id),
  organization_id   uuid REFERENCES organization(id),
  opened_by         uuid NOT NULL REFERENCES account(id),
  status            dispute_status NOT NULL DEFAULT 'open',
  reason            text NOT NULL,
  amount_disputed   bigint,
  resolution_notes  text,
  resolved_by       uuid REFERENCES account(id),
  resolved_at       timestamptz,
  evidence_due_at   timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dispute_evidence (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id    uuid NOT NULL REFERENCES dispute(id) ON DELETE CASCADE,
  submitted_by  uuid NOT NULL REFERENCES account(id),
  description   text NOT NULL,
  file_url      text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE fraud_signal (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind              fraud_signal_kind NOT NULL,
  severity          smallint NOT NULL,                   -- 1 a 5
  account_id        uuid REFERENCES account(id),
  organization_id   uuid REFERENCES organization(id),
  creator_profile_id uuid REFERENCES creator_profile(id),
  booking_id        uuid REFERENCES booking(id),
  review_id         uuid REFERENCES review(id),
  details           jsonb NOT NULL DEFAULT '{}',
  reviewed_at       timestamptz,
  reviewed_by       uuid REFERENCES account(id),
  action_taken      varchar(60),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_fraud_severity CHECK (severity BETWEEN 1 AND 5)
);

-- Registro de acciones administrativas: inmutable
CREATE TABLE audit_log (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_account_id  uuid REFERENCES account(id),
  actor_kind        varchar(20) NOT NULL,                -- user, system, api_client, mcp_client
  action            varchar(80) NOT NULL,
  resource_type     varchar(60) NOT NULL,
  resource_id       uuid,
  organization_id   uuid REFERENCES organization(id),
  before_state      jsonb,
  after_state       jsonb,
  ip_address        inet,
  user_agent        text,
  occurred_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_resource ON audit_log(resource_type, resource_id, occurred_at DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_account_id, occurred_at DESC);

-- EVENTOS DE DOMINIO: append-only. Nunca UPDATE ni DELETE.
-- Fuente de verdad para auditoría, webhooks y analítica.
CREATE TABLE domain_event (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type        varchar(80) NOT NULL,
  aggregate_type    varchar(60) NOT NULL,
  aggregate_id      uuid NOT NULL,
  organization_id   uuid,
  actor_account_id  uuid,
  payload           jsonb NOT NULL,
  version           integer NOT NULL DEFAULT 1,
  occurred_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_event_aggregate ON domain_event(aggregate_type, aggregate_id, occurred_at);
CREATE INDEX idx_event_type_time ON domain_event(event_type, occurred_at DESC);
CREATE INDEX idx_event_org ON domain_event(organization_id, occurred_at DESC);
```

### 4.11 Interoperabilidad, IA y MCP

```sql
-- Conexiones OAuth a sistemas externos. Los tokens se guardan CIFRADOS.
CREATE TABLE external_connection (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id),
  account_id        uuid REFERENCES account(id),
  kind              connector_kind NOT NULL,
  provider          varchar(60) NOT NULL,                -- google_calendar, hubspot, tiktok, wompi...
  external_account_id varchar(200),
  external_account_label varchar(200),
  access_token_encrypted  text NOT NULL,
  refresh_token_encrypted text,
  token_expires_at  timestamptz,
  scopes            text[] NOT NULL DEFAULT '{}',
  direction         sync_direction NOT NULL DEFAULT 'bidirectional',
  status            sync_status NOT NULL DEFAULT 'ok',
  last_sync_at      timestamptz,
  sync_cursor       text,                                -- token de cambio incremental
  revoked_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sync_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id   uuid NOT NULL REFERENCES external_connection(id),
  direction       sync_direction NOT NULL,
  records_in      integer NOT NULL DEFAULT 0,
  records_out     integer NOT NULL DEFAULT 0,
  status          sync_status NOT NULL,
  error_message   text,
  started_at      timestamptz NOT NULL,
  finished_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Aplicaciones de terceros registradas
CREATE TABLE api_client (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid REFERENCES organization(id),
  name              varchar(160) NOT NULL,
  client_id         varchar(64) NOT NULL UNIQUE,
  client_secret_hash text NOT NULL,
  redirect_uris     text[] NOT NULL DEFAULT '{}',
  allowed_scopes    text[] NOT NULL DEFAULT '{}',
  is_mcp_client     boolean NOT NULL DEFAULT false,
  rate_limit_tier   varchar(20) NOT NULL DEFAULT 'standard',
  revoked_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Autorizaciones concedidas: el usuario puede revocar POR HERRAMIENTA, no solo por app
CREATE TABLE api_grant (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_client_id     uuid NOT NULL REFERENCES api_client(id),
  account_id        uuid NOT NULL REFERENCES account(id),
  organization_id   uuid REFERENCES organization(id),
  granted_scopes    text[] NOT NULL,
  denied_tools      text[] NOT NULL DEFAULT '{}',        -- revocación granular por herramienta MCP
  spend_limit_per_session bigint,                        -- límite de gasto por sesión
  expires_at        timestamptz,
  revoked_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Registro de toda llamada MCP, visible para el usuario
CREATE TABLE mcp_call_log (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_client_id   uuid NOT NULL REFERENCES api_client(id),
  account_id      uuid NOT NULL REFERENCES account(id),
  organization_id uuid REFERENCES organization(id),
  tool_name       varchar(80) NOT NULL,
  arguments       jsonb,
  result_summary  text,
  required_confirmation boolean NOT NULL DEFAULT false,
  confirmed_at    timestamptz,
  status          varchar(20) NOT NULL,                  -- ok, denied, error, awaiting_confirmation
  error_message   text,
  duration_ms     integer,
  called_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mcp_log_account ON mcp_call_log(account_id, called_at DESC);

-- Suscripciones a webhooks
CREATE TABLE webhook_subscription (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   uuid NOT NULL REFERENCES organization(id),
  api_client_id     uuid REFERENCES api_client(id),
  url               text NOT NULL,
  secret            varchar(64) NOT NULL,
  event_types       text[] NOT NULL,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE webhook_delivery (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL REFERENCES webhook_subscription(id),
  domain_event_id uuid NOT NULL REFERENCES domain_event(id),
  attempt         integer NOT NULL DEFAULT 1,
  response_status integer,
  response_body   text,
  succeeded_at    timestamptz,
  next_retry_at   timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_webhook_retry ON webhook_delivery(next_retry_at) WHERE succeeded_at IS NULL;

-- Trazabilidad de la IA: modelo, entrada, salida, quién aceptó
CREATE TABLE ai_invocation (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case          varchar(60) NOT NULL,                -- semantic_search, publish_assistant, matching...
  provider          varchar(30) NOT NULL,
  model             varchar(80) NOT NULL,
  account_id        uuid REFERENCES account(id),
  organization_id   uuid REFERENCES organization(id),
  input_summary     text,
  output_summary    text,
  tokens_input      integer,
  tokens_output     integer,
  cost_micros       bigint,
  latency_ms        integer,
  was_accepted      boolean,
  accepted_by       uuid REFERENCES account(id),
  cache_hit         boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_org_cost ON ai_invocation(organization_id, created_at DESC);
```

---

## 5. Seguridad a nivel de fila (RLS)

RLS es la segunda línea de defensa: aunque la capa de aplicación falle, un usuario no puede leer datos de otra organización.

### 5.1 Patrón general

```sql
-- Función auxiliar: organizaciones a las que pertenece el usuario actual
CREATE OR REPLACE FUNCTION current_user_organizations()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT organization_id
  FROM organization_membership
  WHERE account_id = current_setting('app.current_account_id', true)::uuid
    AND accepted_at IS NOT NULL
    AND deleted_at IS NULL;
$$;

-- Ejemplo aplicado a la tabla booking
ALTER TABLE booking ENABLE ROW LEVEL SECURITY;

-- El prestador ve las reservas de su organización
CREATE POLICY booking_org_access ON booking
  FOR ALL
  USING (organization_id IN (SELECT current_user_organizations()));

-- El cliente ve sus propias reservas
CREATE POLICY booking_client_access ON booking
  FOR SELECT
  USING (client_account_id = current_setting('app.current_account_id', true)::uuid);
```

### 5.2 Tablas con RLS obligatorio

| Grupo | Tablas | Política |
|---|---|---|
| **Por organización** | `service`, `service_variant`, `service_media`, `resource`, `availability_rule`, `availability_exception`, `capacity_session`, `booking`, `payment`, `payout`, `invoice`, `promotion`, `crm_contact`, `crm_note`, `crm_segment`, `campaign`, `campaign_application`, `campaign_contract`, `insurance_policy`, `external_connection`, `webhook_subscription` | Pertenencia vía `organization_membership` |
| **Por cuenta** | `client_profile`, `creator_profile`, `collection`, `notification`, `consent`, `data_subject_request`, `payout_account` | Coincidencia con `account_id` |
| **Mixtas** | `review` (autor o prestador), `conversation` (participante), `attribution` (creador o prestador), `ledger_entry` (organización o cuenta) | Política compuesta con OR |
| **Públicas de lectura** | `category`, `policy_version` | `USING (true)` para `SELECT` |
| **Solo servicio** | `domain_event`, `audit_log`, `fraud_signal`, `payment_webhook_event`, `mcp_call_log` | Sin acceso desde el rol de cliente |

**Regla de implementación:** el contexto se establece al inicio de cada transacción con `SET LOCAL app.current_account_id = '<uuid>'`. Nunca se usa el rol de servicio para consultas originadas en peticiones de usuario.

---

## 6. Datos semilla iniciales

El comando `pnpm db:seed` debe dejar el entorno listo para desarrollar sin cargar nada a mano.

### 6.1 Catálogos base

- **Categorías:** las 12 categorías y sus subcategorías de §3.2, con `risk_category` correcta.
- **Versiones de política:** una versión inicial de `terms`, `privacy`, `marketing`, `sensitive_accessibility` y `ai_processing`.
- **Departamentos y municipios de Colombia:** al menos Meta completo (Villavicencio, Acacías, Granada, Puerto López, Restrepo, Cumaral, San Martín, La Macarena, Mesetas, Lejanías, El Calvario) más las capitales principales, con código DANE para ReteICA.

### 6.2 Datos de demostración

| Entidad | Cantidad | Detalle |
|---|---|---|
| Cuentas | 12 | 1 admin, 5 clientes, 3 dueños de empresa, 3 creadores |
| Organizaciones | 4 | Un restaurante llanero, un operador de aventura (con póliza y RNT), un spa urbano, una escuela de formación |
| Servicios | 20 | Cubriendo las cuatro modalidades y al menos una categoría de riesgo alto |
| Recursos | 8 | Personas, salas y un vehículo |
| Reglas de disponibilidad | 20 | Horarios realistas de lunes a domingo |
| Sesiones con cupo | 30 | Próximas 8 semanas |
| Reservas | 60 | Distribuidas entre todos los estados, con pagos y asientos de ledger cuadrados |
| Reseñas | 40 | Con los cinco ejes, incluyendo valores de fidelidad negativos y positivos para poder ver el medidor funcionando |
| Creadores con audiencia | 3 | Uno con audiencia grande y conversión baja, uno hiperlocal con conversión alta, uno con señal de anomalía |
| Campañas | 3 | Una en postulaciones, una en producción, una completada con reporte |
| Atribuciones | 15 | Vinculadas a las campañas |

**Requisito de calidad de las semillas:** los datos deben verse creíbles en español de Colombia, con nombres y lugares del Meta. Un catálogo de demostración con "Servicio de prueba 1" hace imposible evaluar si el diseño funciona.

**Requisito de integridad:** el `pnpm db:seed` debe terminar con una verificación de que todos los `transaction_id` del ledger cuadran (suma de débitos igual a suma de créditos). Si no cuadra, falla ruidosamente.

---

## 7. Inventario total de vistas

Todas las rutas, agrupadas por área. La columna **Fase** indica en qué momento se construye.

### 7.1 Web pública (sin sesión)

| # | Ruta | Vista | Qué contiene | Fase |
|---|---|---|---|---|
| P01 | `/` | Portada | Hero con el concepto, buscador principal, categorías destacadas, servicios mejor calificados por fidelidad, explicación del eje Expectativa vs Realidad | 1 |
| P02 | `/buscar` | Resultados de búsqueda | Filtros (categoría, ciudad, fecha, precio, accesibilidad, fidelidad mínima), orden, mapa opcional, paginación | 1 |
| P03 | `/s/[org]/[servicio]` | Ficha de servicio | Galería, descripción, precio, disponibilidad, **medidor de fidelidad**, reseñas por ejes, accesibilidad, política de cancelación, aviso de riesgo si aplica, prestador | 1 |
| P04 | `/e/[org]` | Perfil público de empresa | Descripción, servicios, reseñas agregadas, fidelidad de promesa, RNT visible, ubicación | 1 |
| P05 | `/c/[handle]` | Perfil público de creador | Bio, audiencia verificada, categorías, **Índice de Fidelidad Promocional**, colecciones, trabajos publicados | 2 |
| P06 | `/categorias` | Índice de categorías | Las 12 categorías con conteo de servicios | 1 |
| P07 | `/categorias/[slug]` | Categoría | Servicios de la categoría con filtros | 1 |
| P08 | `/ciudades/[slug]` | Ciudad | Servicios de la ciudad, landing SEO | 1 |
| P09 | `/colecciones/[handle]/[slug]` | Colección pública | Servicios agrupados por tema | 2 |
| P10 | `/r/[slug]` | Redirección de enlace de creador | Registra el clic, fija la cookie de atribución, redirige | 2 |
| P11 | `/para-empresas` | Landing de captación de oferta | Propuesta de valor para prestadores, precios, formulario | 1 |
| P12 | `/para-creadores` | Landing de captación de creadores | Propuesta de valor, cómo se cobra, requisitos | 2 |
| P13 | `/legal/terminos` | Términos y condiciones | Versión vigente con historial | 1 |
| P14 | `/legal/privacidad` | Política de tratamiento de datos | Ley 1581, canal de reclamos | 1 |
| P15 | `/legal/cookies` | Política de cookies | | 1 |
| P16 | `/ayuda` | Centro de ayuda | Preguntas frecuentes por rol | 1 |
| P17 | `/desarrolladores` | Portal de desarrolladores | OpenAPI navegable, SDK, registro de apps, documentación MCP | 3 |
| P18 | `/404`, `/500` | Errores | Estados con salida útil, no callejón sin salida | 1 |

### 7.2 Autenticación

| # | Ruta | Vista | Fase |
|---|---|---|---|
| A01 | `/entrar` | Inicio de sesión (correo, contraseña, Google) | 1 |
| A02 | `/registro` | Registro con consentimiento explícito de tratamiento de datos | 1 |
| A03 | `/verificar-correo` | Verificación de correo | 1 |
| A04 | `/recuperar` | Solicitud de recuperación | 1 |
| A05 | `/restablecer` | Nueva contraseña | 1 |
| A06 | `/verificar-telefono` | Verificación por SMS | 1 |
| A07 | `/onboarding` | Elección de perfil a activar y primeros pasos | 1 |

### 7.3 Cliente (sesión iniciada)

| # | Ruta | Vista | Qué contiene | Fase |
|---|---|---|---|---|
| C01 | `/mi/inicio` | Panel del cliente | Próximas reservas, recomendaciones, reseñas pendientes | 1 |
| C02 | `/mi/reservas` | Mis reservas | Listado con filtros por estado, próximas y pasadas | 1 |
| C03 | `/mi/reservas/[code]` | Detalle de reserva | Estado, código QR de check-in, pago, política de cancelación, contacto, exención firmada si aplica | 1 |
| C04 | `/reservar/[servicio]` | Flujo de reserva | Pasos: fecha y hora → participantes → datos → exención si aplica → pago | 1 |
| C05 | `/reservar/[servicio]/pago` | Pago | Métodos (tarjeta, PSE, Nequi, Daviplata), desglose completo, código de creador | 1 |
| C06 | `/reservar/confirmacion/[code]` | Confirmación | Resumen, agregar al calendario, compartir | 1 |
| C07 | `/mi/cotizaciones` | Mis cotizaciones | Solicitudes y ofertas recibidas | 1 |
| C08 | `/mi/cotizaciones/[id]` | Detalle de cotización | Hilo de negociación, aceptar oferta | 1 |
| C09 | `/mi/resenas` | Mis reseñas | Pendientes de escribir y publicadas | 1 |
| C10 | `/resenar/[code]` | Escribir reseña | Los cinco ejes, con el **medidor de fidelidad interactivo** como elemento central, accesibilidad, medios | 1 |
| C11 | `/mi/favoritos` | Guardados | Servicios marcados | 1 |
| C12 | `/mi/colecciones` | Mis colecciones | Crear, editar, hacer públicas | 2 |
| C13 | `/mi/colecciones/[slug]` | Detalle de colección | Servicios, orden, notas | 2 |
| C14 | `/mi/mensajes` | Mensajes | Bandeja unificada | 1 |
| C15 | `/mi/mensajes/[id]` | Conversación | Hilo con adjuntos | 1 |
| C16 | `/mi/pagos` | Historial de pagos | Transacciones, facturas descargables, reembolsos | 1 |
| C17 | `/mi/perfil` | Perfil | Datos personales, foto, preferencias | 1 |
| C18 | `/mi/perfil/verificacion` | Verificación | Nivel actual y qué falta para el siguiente | 1 |
| C19 | `/mi/perfil/accesibilidad` | Necesidades de accesibilidad | **Consentimiento separado**, por ser dato sensible | 1 |
| C20 | `/mi/notificaciones` | Notificaciones | Historial y preferencias por canal | 1 |
| C21 | `/mi/privacidad` | Privacidad y datos | Consentimientos otorgados, exportar mis datos, eliminar cuenta | 1 |
| C22 | `/mi/disputas` | Mis disputas | Abrir, seguir, cargar evidencia | 1 |

### 7.4 Empresa — panel de gestión

| # | Ruta | Vista | Qué contiene | Fase |
|---|---|---|---|---|
| E01 | `/panel` | Tablero | Ingresos del periodo, ocupación, próximas reservas, reseñas nuevas, alertas (RNT por vencer, póliza por vencer) | 1 |
| E02 | `/panel/servicios` | Servicios | Listado con estado, métricas por servicio, acciones masivas | 1 |
| E03 | `/panel/servicios/nuevo` | Crear servicio | Formulario por pasos con **asistente de IA** que genera la ficha desde texto libre | 1 |
| E04 | `/panel/servicios/[id]` | Editar servicio | Todos los campos, medios, variantes, recursos, accesibilidad, riesgo | 1 |
| E05 | `/panel/servicios/[id]/disponibilidad` | Disponibilidad del servicio | Reglas por día, excepciones, sesiones con cupo | 1 |
| E06 | `/panel/servicios/[id]/estadisticas` | Estadísticas del servicio | Vistas, conversión, ingresos, reseñas, **medidor de fidelidad** | 1 |
| E07 | `/panel/agenda` | Agenda | Vista de calendario (día, semana, mes) con reservas y bloqueos | 1 |
| E08 | `/panel/agenda/recursos` | Recursos | Personas, salas, equipos, vehículos | 1 |
| E09 | `/panel/agenda/bloqueos` | Bloqueos y excepciones | Cierres, festivos, disponibilidad extraordinaria | 1 |
| E10 | `/panel/reservas` | Reservas | Listado con filtros, confirmar, rechazar, reprogramar | 1 |
| E11 | `/panel/reservas/[code]` | Detalle de reserva | Cliente, pago, participantes, check-in, notas internas | 1 |
| E12 | `/panel/cotizaciones` | Cotizaciones | Pipeline por etapas con probabilidad | 1 |
| E13 | `/panel/cotizaciones/[id]` | Responder cotización | Crear oferta, negociar, convertir en reserva | 1 |
| E14 | `/panel/resenas` | Reseñas | Todas las reseñas, **resumen generado por IA**, responder, reportar | 1 |
| E15 | `/panel/resenas/fidelidad` | Diagnóstico de promesa | Análisis de la brecha Expectativa vs Realidad, divergencias de accesibilidad, sugerencias | 1 |
| E16 | `/panel/clientes` | CRM | Contactos, segmentos, filtros, importar y exportar | 2 |
| E17 | `/panel/clientes/[id]` | Ficha de cliente | Historial, gasto, notas, etiquetas, origen | 2 |
| E18 | `/panel/clientes/segmentos` | Segmentos | Segmentos dinámicos con reglas | 2 |
| E19 | `/panel/campanas` | Campañas | Listado con estado y resultados | 2 |
| E20 | `/panel/campanas/nueva` | Crear campaña | Brief guiado con **IA**, presupuesto, entregables, plazos, licencia | 2 |
| E21 | `/panel/campanas/[id]` | Detalle de campaña | **Línea de tiempo de las 12 etapas**, estado actual | 2 |
| E22 | `/panel/campanas/[id]/creadores` | Emparejamiento | Creadores ordenados por ajuste, **con explicación de por qué**, invitar | 2 |
| E23 | `/panel/campanas/[id]/postulaciones` | Postulaciones | Recibidas con puntaje, aceptar, rechazar, contraofertar | 2 |
| E24 | `/panel/campanas/[id]/contratos` | Contratos | Firmados, pendientes, escrow retenido | 2 |
| E25 | `/panel/campanas/[id]/entregables` | Entregables | Revisar borradores, comentar con marca de tiempo, aprobar | 2 |
| E26 | `/panel/campanas/[id]/reporte` | Reporte de campaña | Alcance, clics, reservas atribuidas, GMV, ROAS, exportable | 2 |
| E27 | `/panel/buscar-creadores` | Buscar creadores | Directorio con filtros de audiencia, ciudad, categoría, fidelidad | 2 |
| E28 | `/panel/pagos` | Pagos y liquidaciones | Ingresos, comisiones, retenciones, **tabla de ledger** | 1 |
| E29 | `/panel/pagos/retiros` | Retiros | Solicitar, historial, cuentas de destino verificadas | 1 |
| E30 | `/panel/pagos/facturas` | Facturación | Facturas emitidas, documentos soporte, descarga XML y PDF | 2 |
| E31 | `/panel/promociones` | Promociones | Cupones, descuentos, presupuesto consumido | 2 |
| E32 | `/panel/mensajes` | Mensajes | Bandeja unificada con plantillas y **borradores de IA** | 1 |
| E33 | `/panel/reportes` | Reportes | Ingresos, ocupación, cohortes, origen del tráfico, exportación | 2 |
| E34 | `/panel/reportes/asistente` | Analista conversacional | Preguntas en lenguaje natural sobre las métricas | 3 |
| E35 | `/panel/integraciones` | Integraciones | Conectores disponibles y activos, estado de sincronización | 3 |
| E36 | `/panel/integraciones/[proveedor]` | Configurar conector | Autorizar, mapear campos, dirección de sincronización, revocar | 3 |
| E37 | `/panel/integraciones/canales` | Canales OTA | Publicar en Viator, GetYourGuide, Civitatis; sincronizar disponibilidad | 3 |
| E38 | `/panel/integraciones/api` | API y webhooks | Claves, alcances, suscripciones a eventos, registro de entregas | 3 |
| E39 | `/panel/integraciones/mcp` | Asistentes conectados | Apps MCP autorizadas, **revocación por herramienta**, límite de gasto, registro de llamadas | 3 |
| E40 | `/panel/disputas` | Disputas | Abiertas, evidencia, resolución | 1 |
| E41 | `/panel/configuracion` | Configuración general | Datos de la empresa, logo, contacto, redes | 1 |
| E42 | `/panel/configuracion/legal` | Legal y cumplimiento | NIT, RNT con vigencia, pólizas, alertas de vencimiento | 1 |
| E43 | `/panel/configuracion/equipo` | Equipo | Miembros, roles, invitaciones | 1 |
| E44 | `/panel/configuracion/pagos` | Configuración de pagos | Proveedor, cuentas de destino, comisiones | 1 |
| E45 | `/panel/configuracion/politicas` | Políticas | Cancelación por defecto, plazos, aprobación tácita | 1 |
| E46 | `/panel/configuracion/notificaciones` | Notificaciones | Preferencias por evento y canal | 1 |
| E47 | `/panel/configuracion/suscripcion` | Plan y facturación | Plan actual, uso, historial de cobros | 2 |

### 7.5 Creador — panel

| # | Ruta | Vista | Qué contiene | Fase |
|---|---|---|---|---|
| K01 | `/creador` | Tablero | Ingresos, campañas activas, entregables pendientes, invitaciones nuevas | 2 |
| K02 | `/creador/perfil` | Mi perfil | Bio, categorías, ciudades, tarifas por formato, disponibilidad | 2 |
| K03 | `/creador/perfil/audiencia` | Audiencia verificada | Redes conectadas, métricas por red, demografía, alerta de anomalía | 2 |
| K04 | `/creador/perfil/mediakit` | Kit de medios | Generado con datos verificados, exportable a PDF | 2 |
| K05 | `/creador/oportunidades` | Campañas abiertas | Briefs disponibles filtrados por ajuste, postular | 2 |
| K06 | `/creador/oportunidades/[id]` | Detalle de brief | Objetivo, entregables, presupuesto, licencia, **precio sugerido por IA** | 2 |
| K07 | `/creador/invitaciones` | Invitaciones | Recibidas de empresas, aceptar, rechazar, contraofertar | 2 |
| K08 | `/creador/campanas` | Mis campañas | Activas y completadas con estado | 2 |
| K09 | `/creador/campanas/[id]` | Detalle de campaña | **Línea de tiempo de las 12 etapas**, materiales de marca, escrow retenido | 2 |
| K10 | `/creador/campanas/[id]/entregables` | Entregables | Cargar borrador, ver comentarios, rondas restantes, plazo de aprobación tácita | 2 |
| K11 | `/creador/campanas/[id]/publicar` | Registrar publicación | Vincular el post, **verificación de revelación publicitaria** | 2 |
| K12 | `/creador/campanas/[id]/resultados` | Resultados | Alcance, clics, reservas atribuidas, comisión generada | 2 |
| K13 | `/creador/enlaces` | Enlaces y códigos | Crear, copiar, ver clics y conversiones por enlace | 2 |
| K14 | `/creador/colecciones` | Mis colecciones | Agrupar servicios por tema para promocionar | 2 |
| K15 | `/creador/ingresos` | Ingresos | Comisiones, honorarios, pendiente por cobrar, **ledger** | 2 |
| K16 | `/creador/ingresos/retiros` | Retiros | Solicitar, historial, cuenta de destino verificada | 2 |
| K17 | `/creador/desempeno` | Desempeño | **Índice de Fidelidad Promocional**, tasa de conversión, comparativa con su segmento | 2 |
| K18 | `/creador/mensajes` | Mensajes | Bandeja con empresas | 2 |
| K19 | `/creador/mis-servicios` | Servicios propios | Si activó perfil Empresa: sus asesorías, clases, etc. | 2 |
| K20 | `/creador/configuracion` | Configuración | Cuenta, notificaciones, preferencias de campaña, exclusividades | 2 |

### 7.6 Administración de la plataforma

| # | Ruta | Vista | Fase |
|---|---|---|---|
| X01 | `/admin` | Tablero de salud del marketplace: GMV, take rate, liquidez por categoría y ciudad | 1 |
| X02 | `/admin/organizaciones` | Organizaciones: verificar, suspender, ajustar comisión | 1 |
| X03 | `/admin/cuentas` | Cuentas: verificación, suspensión, historial | 1 |
| X04 | `/admin/servicios` | Moderación de servicios: pendientes de revisión, reportados | 1 |
| X05 | `/admin/resenas` | Moderación de reseñas | 1 |
| X06 | `/admin/disputas` | Disputas escaladas a mediación | 1 |
| X07 | `/admin/fraude` | Señales de fraude: por tipo, severidad, acción tomada | 2 |
| X08 | `/admin/pagos` | Conciliación: pagos, ledger, cuadre, retiros pendientes | 1 |
| X09 | `/admin/cumplimiento` | RNT y pólizas por vencer, solicitudes de derechos de titulares | 1 |
| X10 | `/admin/categorias` | Taxonomía: categorías y riesgo asociado | 1 |
| X11 | `/admin/politicas` | Versiones de políticas y consentimientos | 1 |
| X12 | `/admin/ia` | Uso y costo de IA por organización, invocaciones, tasa de aceptación | 2 |
| X13 | `/admin/integraciones` | Clientes de API y MCP registrados, alcances, registro de llamadas | 3 |
| X14 | `/admin/eventos` | Explorador de eventos de dominio | 2 |
| X15 | `/admin/auditoria` | Registro de auditoría de acciones administrativas | 1 |
| X16 | `/admin/banderas` | Banderas de funcionalidad | 1 |

### 7.7 Aplicación móvil (Expo)

La app móvil no replica el panel completo: cubre lo que se hace en movimiento.

| # | Ruta | Pantalla | Rol | Fase |
|---|---|---|---|---|
| M01 | `/(tabs)/explorar` | Explorar y buscar | Cliente | 1 |
| M02 | `/(tabs)/reservas` | Mis reservas | Cliente | 1 |
| M03 | `/(tabs)/mensajes` | Mensajes | Todos | 1 |
| M04 | `/(tabs)/perfil` | Perfil | Todos | 1 |
| M05 | `/servicio/[id]` | Ficha de servicio | Cliente | 1 |
| M06 | `/reservar/[id]` | Flujo de reserva y pago | Cliente | 1 |
| M07 | `/reserva/[code]` | Detalle de reserva con QR | Cliente | 1 |
| M08 | `/resenar/[code]` | Escribir reseña con medidor táctil | Cliente | 1 |
| M09 | `/(negocio)/agenda` | Agenda del día | Empresa | 1 |
| M10 | `/(negocio)/reservas` | Reservas por confirmar | Empresa | 1 |
| M11 | `/(negocio)/checkin` | Escáner QR de check-in | Empresa | 1 |
| M12 | `/(negocio)/resumen` | Resumen de ingresos del día | Empresa | 1 |
| M13 | `/(creador)/campanas` | Campañas activas | Creador | 2 |
| M14 | `/(creador)/entregables` | Cargar entregable desde el teléfono | Creador | 2 |
| M15 | `/(creador)/ingresos` | Ingresos y retiros | Creador | 2 |
| M16 | `/notificaciones` | Notificaciones push | Todos | 1 |
| M17 | `/auth/*` | Autenticación | — | 1 |

**Total: 18 vistas públicas + 7 de autenticación + 22 de cliente + 47 de empresa + 20 de creador + 16 de administración + 17 pantallas móviles = 147 vistas.**

De esas, **73 son de Fase 1** y constituyen el MVP transaccional.

---

## 8. Mapa de API

Rutas base: `https://api.dejatellevar.com/v1` · Autenticación por OAuth 2.1 o clave de API · Alcances granulares.

### 8.1 Endpoints por recurso

```
# Catálogo (público en lectura)
GET    /v1/categories
GET    /v1/services                       ?q&category&city&date&price_min&price_max&accessibility&sort
GET    /v1/services/:id
GET    /v1/services/:id/availability      ?from&to
GET    /v1/services/:id/reviews
POST   /v1/services                       catalog:write
PATCH  /v1/services/:id                   catalog:write
DELETE /v1/services/:id                   catalog:write
POST   /v1/services/:id/media             catalog:write
GET    /v1/organizations/:slug
GET    /v1/creators                       creators:read
GET    /v1/creators/:handle

# Disponibilidad y agenda
GET    /v1/resources                      catalog:read
POST   /v1/resources                      catalog:write
GET    /v1/availability/rules             catalog:read
POST   /v1/availability/rules             catalog:write
POST   /v1/availability/exceptions        catalog:write
GET    /v1/availability/sessions          catalog:read
POST   /v1/availability/sessions          catalog:write
GET    /v1/calendar/:token.ics            público con token

# Reservas
GET    /v1/bookings                       bookings:read
POST   /v1/bookings                       bookings:write   Idempotency-Key
GET    /v1/bookings/:code                 bookings:read
POST   /v1/bookings/:code/confirm         bookings:write
POST   /v1/bookings/:code/reschedule      bookings:write
POST   /v1/bookings/:code/cancel          bookings:write
POST   /v1/bookings/:code/checkin         bookings:write
POST   /v1/bookings/:code/complete        bookings:write

# Cotizaciones
POST   /v1/quotes                         bookings:write
GET    /v1/quotes/:id                     bookings:read
POST   /v1/quotes/:id/offers              bookings:write
POST   /v1/quotes/:id/offers/:v/accept    bookings:write

# Pagos
POST   /v1/payments                       payments:write   Idempotency-Key
GET    /v1/payments/:id                   payments:read
POST   /v1/payments/:id/refund            payments:write
GET    /v1/ledger                         payments:read    ?from&to&account_type
GET    /v1/ledger/balance                 payments:read
POST   /v1/payouts                        payments:write
GET    /v1/payouts                        payments:read
GET    /v1/invoices                       payments:read
POST   /webhooks/wompi                    firma verificada, público
POST   /webhooks/mercadopago              firma verificada, público

# Reseñas
POST   /v1/reviews                        reviews:write
GET    /v1/reviews/:id                    reviews:read
POST   /v1/reviews/:id/respond            reviews:write
GET    /v1/reviews/summary                reviews:read     resumen con IA
GET    /v1/organizations/:id/fidelity     reviews:read

# Campañas
GET    /v1/campaigns                      campaigns:read
POST   /v1/campaigns                      campaigns:write
GET    /v1/campaigns/:id                  campaigns:read
POST   /v1/campaigns/:id/publish          campaigns:write
GET    /v1/campaigns/:id/matches          campaigns:read   emparejamiento con explicación
POST   /v1/campaigns/:id/invite           campaigns:write
GET    /v1/campaigns/:id/applications     campaigns:read
POST   /v1/applications/:id/offers        campaigns:write
POST   /v1/applications/:id/accept        campaigns:write
GET    /v1/contracts/:id                  campaigns:read
POST   /v1/contracts/:id/sign             campaigns:write
GET    /v1/deliverables                   campaigns:read
POST   /v1/deliverables/:id/submit        campaigns:write
POST   /v1/deliverables/:id/review        campaigns:write
POST   /v1/deliverables/:id/publish       campaigns:write
GET    /v1/campaigns/:id/report           campaigns:read

# Atribución
POST   /v1/tracking/links                 campaigns:write
GET    /v1/tracking/links                 campaigns:read
GET    /v1/attributions                   campaigns:read
POST   /v1/attributions/:id/dispute       campaigns:write

# CRM
GET    /v1/contacts                       crm:read
POST   /v1/contacts                       crm:write
PATCH  /v1/contacts/:id                   crm:write
POST   /v1/contacts/:id/notes             crm:write
GET    /v1/segments                       crm:read

# Mensajería
GET    /v1/conversations                  messages:read
POST   /v1/conversations/:id/messages     messages:write

# Analítica
GET    /v1/analytics/overview             analytics:read
GET    /v1/analytics/revenue              analytics:read   ?from&to&granularity
GET    /v1/analytics/occupancy            analytics:read
GET    /v1/analytics/cohorts              analytics:read
GET    /v1/analytics/attribution          analytics:read

# Cuenta y cumplimiento
GET    /v1/me                             perfil del token actual
PATCH  /v1/me
GET    /v1/me/consents
POST   /v1/me/consents
POST   /v1/me/data-requests               exportación o eliminación

# Interoperabilidad
GET    /v1/connectors                     integrations:read
POST   /v1/connectors/:provider/authorize integrations:write
DELETE /v1/connectors/:id                 integrations:write
GET    /v1/webhooks                       integrations:read
POST   /v1/webhooks                       integrations:write
GET    /v1/webhooks/:id/deliveries        integrations:read
POST   /v1/webhooks/:id/deliveries/:d/retry

# MCP
POST   /mcp                               JSON-RPC 2.0, OAuth 2.1
GET    /.well-known/oauth-protected-resource
GET    /.well-known/openid-configuration
```

### 8.2 Convenciones de la API

| Aspecto | Regla |
|---|---|
| **Paginación** | Por cursor: `?cursor=<opaco>&limit=20`. Respuesta incluye `next_cursor` |
| **Idempotencia** | `Idempotency-Key` obligatorio en `POST` que crean recursos con efecto económico |
| **Errores** | Formato uniforme: `{ error: { code, message, details? } }`. Códigos en `SCREAMING_SNAKE_CASE` |
| **Dinero** | Siempre `{ amount: 8500000, currency: "COP" }` en centavos. Nunca decimales en el transporte |
| **Fechas** | ISO 8601 con zona: `2026-08-12T15:00:00-05:00` |
| **Caché** | `ETag` en recursos de lectura; `If-None-Match` soportado |
| **Límites** | `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` |
| **Versionado** | En la ruta. Obsolescencia anunciada con 12 meses de antelación vía `Sunset` header |

---

## 9. Prompt maestro para Claude Code

Este es el prompt de la primera sesión, ya con los dos documentos en el repositorio.

```
Vas a inicializar el proyecto "DejateLlevar". Antes de escribir código, presenta
un plan y espera mi aprobación.

=== DOCUMENTACIÓN DEL PROYECTO ===

He puesto dos documentos en la carpeta docs/. Léelos AMBOS completos antes de
planear nada:

  @docs/00-documento-consolidado.md
     Contexto de negocio, investigación de mercado, reglas de dominio,
     cumplimiento legal colombiano, arquitectura conceptual y hoja de ruta.

  @docs/01-especificacion-tecnica.md
     Sistema de diseño con paleta y tipografía, modelo de datos completo con
     todas las tablas, enumeraciones, políticas RLS, inventario de 147 vistas
     y mapa de API.

Todo lo que necesitas saber está ahí. Si algo se contradice entre lo que yo
escriba en este prompt y lo que digan los documentos, pregúntame antes de
decidir.

=== OBJETIVO DE ESTA SESIÓN ===

Crear los cimientos completos del proyecto:
  - Monorepo configurado y funcionando
  - Capa de dominio con puertos y un caso de uso de ejemplo probado
  - EL ESQUEMA DE BASE DE DATOS COMPLETO de la sección 4 del documento técnico,
    con sus migraciones, políticas RLS y datos semilla
  - Sistema de diseño implementado como tokens y componentes base
  - API funcionando de extremo a extremo con dos endpoints reales
  - Web y móvil arrancando y consumiendo esa API

NO implementes funcionalidades de negocio más allá de eso. Quiero cimientos
correctos, no features a medias.

=== LA RESTRICCIÓN QUE GOBIERNA TODO: PORTABILIDAD ===

Despliego en Vercel + Supabase porque es lo más rápido para empezar, pero el
proyecto DEBE poder migrar sin reescribirse.

  REGLA DE ORO: packages/core NUNCA importa Next.js, Vercel, Supabase, React ni
  ningún SDK de proveedor. Solo TypeScript, Zod y sus propios tipos. Si necesita
  hablar con el exterior, define un puerto (interfaz) y otro paquete lo
  implementa.

Consecuencias concretas (la sección 19 del documento consolidado las detalla):
  - Consultas con Drizzle ORM sobre Postgres estándar, NO con el cliente de
    Supabase. Supabase es "un Postgres con hosting", no un framework.
  - Auth detrás del puerto AuthProvider. Adaptador inicial: Supabase Auth.
  - Archivos detrás del puerto StorageProvider. Adaptador inicial: Supabase Storage.
  - Pagos detrás del puerto PaymentProvider. Adaptador inicial: Wompi.
    Stripe NO opera oficialmente en Colombia: no lo uses.
  - API escrita con Hono, montada en Next.js en app/api/[[...route]]/route.ts.
  - Next.js con output: "standalone" desde el día uno.
  - Cero uso de @vercel/kv, @vercel/blob o similares en el dominio.

=== STACK ===

Monorepo pnpm workspaces + Turborepo:

  apps/web        Next.js 15 App Router + TypeScript + Tailwind + shadcn/ui
  apps/mobile     Expo + expo-router + NativeWind
  packages/core   Dominio puro: entidades, casos de uso, puertos
  packages/db     Drizzle: esquema, migraciones, repositorios, adaptadores
  packages/api    Hono + Zod + OpenAPI 3.1
  packages/contracts  Esquemas Zod compartidos, única fuente de verdad de tipos
  packages/ui     Tokens de diseño y componentes
  packages/config TypeScript, Biome y Tailwind compartidos

Validación con Zod en toda frontera. Datos en cliente con TanStack Query.
Pruebas con Vitest y Playwright. Formato y linter con Biome. Git hooks con
Lefthook.

=== REGLAS DE CÓDIGO INNEGOCIABLES ===

Están en la sección 2 del documento técnico y en CLAUDE.md. Las repito porque
son las que más se rompen sin querer:

1. DINERO: enteros en centavos, siempre. Money = { amount: number, currency }.
   En base de datos bigint. Nunca float, nunca decimales en el transporte.
2. FECHAS: timestamptz, almacenamiento en UTC. America/Bogota solo al presentar.
3. IDs: UUID. Nunca enteros autoincrementales expuestos.
4. MULTI-INQUILINO: organizationId explícito en la firma de cada método de
   repositorio, más RLS activo en Postgres.
5. EVENTOS: ningún cambio de estado importante sin escribir en domain_event.
   Esa tabla es append-only: nada de UPDATE ni DELETE.
6. ERRORES: los casos de uso devuelven Result<T, E>. Excepciones solo para
   fallas imprevistas.
7. ENTORNO: variables validadas con Zod al arrancar. Si falta una, no levanta.
8. Tokens en cookies httpOnly. Nada sensible en localStorage.

=== QUÉ QUIERO QUE HAGAS ===

FASE 1 — Plan (espera mi aprobación)

Preséntame:
  a) Árbol de carpetas completo con el propósito de cada una
  b) Lista de puertos que vas a definir en packages/core, con su firma
  c) Orden en que vas a crear las migraciones y por qué
  d) Cómo vas a implementar la restricción de exclusión que impide la doble
     reserva (sección 4.5 del documento técnico, tabla booking_resource)
  e) Cómo vas a garantizar que el ledger siempre cuadre
  f) Decisiones donde veas más de una opción razonable, con tu recomendación
  g) Qué NO vas a hacer en esta sesión

FASE 2 — Ejecución

1. Monorepo con pnpm y Turborepo. packages/config con las configuraciones
   compartidas.

2. packages/contracts: esquemas Zod base (Money, Address, Pagination,
   AccessibilityProfile, FidelityScore) y los tipos derivados.

3. packages/core:
   - Entidades: Account, Organization, Service, Booking, Review, Campaign
   - Puertos: AuthProvider, StorageProvider, PaymentProvider, EventPublisher,
     SocialProvider, LLMProvider, y un repositorio por entidad
   - Un caso de uso completo y probado: CreateBooking, con las invariantes de
     negocio (no doble reserva, política de cancelación, requisito de exención
     en categorías de riesgo). Pruebas con implementaciones falsas de los
     puertos, sin red ni base de datos.

4. packages/db — LA PARTE MÁS IMPORTANTE DE ESTA SESIÓN:
   - Extensiones de la sección 2.4 del documento técnico
   - TODAS las enumeraciones de la sección 3.1
   - TODAS las tablas de la sección 4, en migraciones ordenadas por dependencia
   - Los índices especificados, incluyendo el HNSW para pgvector
   - Las restricciones CHECK y la restricción de exclusión GiST de
     booking_resource
   - Las políticas RLS de la sección 5
   - Los repositorios que implementan los puertos de core
   - Datos semilla de la sección 6, con nombres y lugares reales del Meta,
     y verificación de que el ledger cuadre al terminar

5. packages/ui: los tokens de la sección 1 (paleta, tipografía, espaciado,
   radios), configuración de Tailwind derivada de ellos, y los componentes
   primitivos. Implementa además el FidelityMeter de la sección 1.5, que es el
   elemento firma del producto, con su versión accesible.

6. packages/api con Hono:
   - Middleware de autenticación, contexto de organización, manejo de errores,
     idempotencia y límites de uso
   - Endpoints funcionales: GET /v1/services (con filtros) y POST /v1/services
   - Generación de OpenAPI 3.1

7. apps/web con Next.js 15:
   - API montada en app/api/[[...route]]/route.ts
   - La portada (P01) y la búsqueda (P02) del inventario de vistas, consumiendo
     la API real, con el sistema de diseño aplicado
   - Tipografías cargadas correctamente

8. apps/mobile con Expo:
   - expo-router con la estructura de tabs de la sección 7.7
   - La pantalla M01 (Explorar) consumiendo la misma API con el mismo cliente
     tipado que la web

9. Infraestructura:
   - docker-compose.yml con Postgres 16 y pgvector, para desarrollar sin
     depender de Supabase
   - .env.example completo y comentado
   - Scripts: dev, dev:web, dev:mobile, build, test, test:e2e, typecheck, lint,
     db:local, db:migrate, db:seed, db:studio, db:reset
   - GitHub Actions con typecheck, lint, test y build

10. README.md con instrucciones para que alguien clone el repo y lo tenga
    corriendo en menos de diez minutos.

11. Actualiza CLAUDE.md con lo que haya cambiado y su sección de estado.

FASE 3 — Verificación

  - pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm build
  - pnpm db:local && pnpm db:migrate && pnpm db:seed
  - Verifica que la restricción de exclusión funciona: escribe una prueba que
    intente reservar el mismo recurso en el mismo horario dos veces y confirme
    que la segunda falla a nivel de base de datos.
  - Verifica que el ledger de las semillas cuadra.
  - Confirma que apps/web levanta y muestra servicios reales con el diseño
    aplicado.
  - Resume qué quedó hecho, qué quedó pendiente y cuál es el siguiente paso.

=== CÓMO QUIERO QUE TRABAJES ===

- Explícame las decisiones técnicas no obvias en español, en una o dos frases.
  Estoy aprendiendo.
- Pocas dependencias bien elegidas. Antes de agregar una librería, dime qué
  problema resuelve.
- Si algo de lo que pedí es mala idea, dilo y propón la alternativa. No lo
  implementes mal para complacerme.
- Nombres de código en inglés; textos de usuario, comentarios de dominio y
  documentación en español de Colombia.
- Commits pequeños en formato convencional.
- Avísame antes de compactar el contexto.
- Si el esquema completo es demasiado para una sola sesión, dímelo al presentar
  el plan y propón cómo partirlo. Prefiero dos sesiones bien hechas a una a
  medias.

Empieza por la Fase 1: el plan.
```

---

## 10. Prompts de continuación por módulo

Una vez existan los cimientos, cada módulo se construye con su propio prompt. Todos asumen que los documentos siguen en `docs/`.

### 10.1 Autenticación y verificación

```
Implementa el módulo de identidad completo, siguiendo la sección 4.1 del
documento técnico y las vistas A01 a A07 del inventario.

Incluye: registro, verificación de correo y teléfono, inicio de sesión,
recuperación, y acceso con Google.

Los seis niveles de verificación (l0_email a l5_insurance) deben modelarse como
una función pura del dominio que, dado el estado de una cuenta, devuelve el
nivel alcanzado y qué falta para el siguiente. No como condicionales dispersos.

CRÍTICO — Ley 1581 de 2012: el consentimiento se registra en la tabla consent
con referencia a policy_version, propósito, marca de tiempo, IP y user agent.
Un booleano no es prueba suficiente. Implementa también la vista C21
(privacidad) con exportación y eliminación de datos.

El puerto AuthProvider ya existe. Escribe SupabaseAuthProvider en
packages/db/adapters. Nada fuera de ese archivo importa Supabase.

Pruebas con FakeAuthProvider, sin red.
```

### 10.2 Catálogo

```
Implementa el módulo de catálogo: tablas de la sección 4.3, vistas E02 a E06 del
panel y P03, P06, P07 públicas.

Las cuatro modalidades (scheduled, capacity, on_demand, digital) deben resolverse
de forma polimórfica en el dominio, no con if anidados en cada consulta.

Reglas de negocio que van en el dominio, no en la interfaz:
  - Un servicio de categoría turística no se publica sin RNT vigente
  - Un servicio de risk_category alto no se publica sin insurance_policy vigente
  - Un servicio con pricing_mode 'quote_only' no puede tener base_price

Incluye el asistente de publicación con IA (vista E03): la empresa describe su
servicio en texto libre y el modelo genera la ficha completa. La salida DEBE
validarse contra el esquema Zod antes de guardarse, y quedar registrada en
ai_invocation. Etiqueta visiblemente el contenido generado.
```

### 10.3 Agenda

```
Implementa el motor de disponibilidad: tablas de la sección 4.4, vistas E07 a
E09.

Debe resolver: reglas por día de semana, excepciones, recursos con intersección
de disponibilidad, buffers, antelación mínima y máxima, y sesiones con cupo.

La restricción de exclusión GiST sobre booking_resource ya existe: apóyate en
ella. Escribe una prueba de concurrencia real que confirme que dos reservas
simultáneas del mismo recurso no pueden coexistir.

Genera el feed iCalendar (RFC 5545) con token secreto de la tabla
calendar_feed_token. Es la base de la sincronización con Google Calendar.
```

### 10.4 Reservas y pagos

```
Implementa reservas y pagos: tablas de las secciones 4.5 y 4.6, vistas C04 a
C06, E10, E11, E28, E29.

Modela booking_status como máquina de estados explícita: las transiciones
inválidas deben ser imposibles de expresar en el tipo, no solo rechazadas en
ejecución.

Pagos con Wompi detrás de PaymentProvider. Métodos: tarjeta, PSE, Nequi,
Daviplata. El dinero se retiene hasta completar el servicio.

LEDGER: doble entrada estricta. Cada operación genera un transaction_id con
asientos que cuadran. Implementa una verificación programada que detecte
cualquier transaction_id descuadrado y alerte. El saldo se calcula, nunca se
guarda.

Las tres invariantes que nos mantienen fuera del régimen SEDPE (sección 5.4 del
documento consolidado) van codificadas en el dominio:
  - Sin recarga de saldo sin destino transaccional
  - Sin transferencias entre usuarios sin servicio subyacente
  - Retiros solo a cuenta del titular verificado (payout_account con
    holder_document que coincida)

Webhook de Wompi con verificación de firma e idempotencia vía
payment_webhook_event: el mismo evento tres veces se procesa una.
```

### 10.5 Reseñas y el medidor de fidelidad

```
Implementa reseñas: tablas de la sección 4.7, vistas C10, E14, E15.

Los cinco ejes de review_axis con sus rangos. El eje expectation_vs_reality va
de -3 a +3; los demás de 1 a 5. La restricción CHECK ya lo garantiza.

Solo puede reseñar quien tenga una reserva en estado 'completed' y pagada:
invariante del dominio.

La vista C10 debe usar el FidelityMeter de forma INTERACTIVA: el cliente arrastra
el indicador. En móvil debe funcionar bien al tacto. Cumple los requisitos de
accesibilidad de la sección 1.5: role="meter", valor y etiqueta textual siempre
visibles, no solo color.

review_accessibility_report contrasta lo declarado con lo reportado. Cuando
has_divergence es true, emite el evento accessibility_divergence.detected. Estos
datos pueden ser sensibles: se agregan, nunca se muestran individualizados.

Calcula service.expectation_fidelity y organization.promise_fidelity. Con menos
de 5 reseñas, el medidor muestra "Aún sin datos suficientes". Nunca inventa un
número.

Implementa el resumen de reseñas con IA (vista E14), recalculado por lote.
```

Los prompts de creadores, campañas, atribución, interoperabilidad y MCP siguen el mismo patrón, apoyándose en las secciones 4.8, 4.11, 7.4, 7.5 y 8 de este documento y en las secciones 12, 14 y 15 del documento consolidado.

---

## Cierre

Este documento y el Documento Maestro Consolidado son, juntos, la especificación completa del proyecto. Con ambos en `docs/` y el prompt de la §9, Claude Code tiene todo lo necesario para construir cimientos correctos.

**Tres cosas que conviene no perder de vista al empezar:**

**El esquema completo es grande.** 60 tablas es mucho para una sola sesión. Si Claude propone partirlo en dos o tres migraciones separadas, acepta: es la respuesta correcta.

**El elemento firma importa más de lo que parece.** El medidor de fidelidad no es decoración: es el diferenciador del producto hecho visible. Si esa pieza queda mediocre, el producto entero pierde su argumento.

**Y la advertencia que ya está en el documento consolidado, repetida aquí porque es la que más se ignora:** todo esto es inútil si se construye antes de validar. La Fase 0 —entrevistas, operación manual por WhatsApp, cartas de intención— cuesta ocho semanas y casi nada de dinero, y es lo único que puede evitar que construyas 147 vistas que nadie va a usar.
