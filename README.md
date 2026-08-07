# DéjateLlevar

Sistema operativo comercial para servicios y creadores de contenido. Un negocio
publica su servicio, lo vende, lo agenda, lo cobra, contrata creadores para
promocionarlo con **atribución de ventas real** y mide el resultado — sin salir de
la plataforma. Mercado inicial: **Villavicencio y el departamento del Meta, Colombia**.

El diferenciador es el **Índice de Fidelidad Promocional**: el cliente califica de
−3 a +3 qué tan fiel fue el servicio respecto a lo prometido. Nadie más mide esa brecha.

> Especificación completa en [`docs/`](docs/). Léela antes de construir.

## Stack

Monorepo **pnpm + Turborepo**. Regla de oro: `packages/core` no importa ningún SDK de
proveedor — todo lo externo entra por un puerto (interfaz). Así el proyecto puede
migrar de Vercel/Supabase sin reescribirse.

| Paquete | Contenido |
|---|---|
| `apps/web` | Next.js 15 App Router + Tailwind + shadcn/ui |
| `apps/mobile` | Expo + expo-router + NativeWind |
| `packages/core` | Dominio puro: entidades, casos de uso, puertos |
| `packages/db` | Drizzle: esquema, migraciones SQL, RLS, seed, repositorios, adaptadores |
| `packages/api` | Hono + Zod + OpenAPI 3.1 |
| `packages/contracts` | Esquemas Zod compartidos |
| `packages/ui` | Tokens de diseño + componentes (incluye el `FidelityMeter`) |
| `packages/config` | TypeScript, Tailwind y validación de entorno compartidos |

## Puesta en marcha (menos de 10 minutos)

Requisitos: **Node ≥ 20.11**, **pnpm 9**, **Docker** (para Postgres local).

```bash
# 1. Dependencias
corepack enable && corepack prepare pnpm@9.15.0 --activate   # si no tienes pnpm
pnpm install

# 2. Variables de entorno
cp .env.example .env.local
#   Para desarrollo local con Docker, los valores por defecto ya funcionan.

# 3. Base de datos local (Postgres 16 + pgvector)
pnpm db:local        # levanta el contenedor
pnpm db:migrate      # aplica el esquema completo
pnpm db:seed         # carga datos del Meta y verifica el cuadre del ledger

# 4. Arrancar
pnpm dev             # web en http://localhost:3000
pnpm dev:web         # solo web
pnpm dev:mobile      # solo app móvil (Expo)
```

## Verificación

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

- `packages/core` incluye la prueba de `CreateBooking` (sin red ni BD, con fakes).
- `packages/db` incluye una prueba que confirma que la **restricción de exclusión GiST**
  impide reservar el mismo recurso en el mismo horario dos veces, a nivel de base de datos.
- El `seed` termina fallando ruidosamente si algún `transaction_id` del ledger no cuadra.

## Despliegue

- **Web**: Vercel (Next.js `output: "standalone"`).
- **Base de datos + Auth + Storage**: Supabase (es "un Postgres con hosting").
- La portabilidad está garantizada por los puertos: cambiar de proveedor es escribir un adaptador.

## Cumplimiento (Colombia)

El diseño incorpora RNT (Ley 2068/2020), tratamiento de datos (Ley 1581/2012),
arquitectura de pagos sin captación (fuera del régimen SEDPE, Ley 1735/2014),
revelación publicitaria (guía SIC 2020) y póliza obligatoria en categorías de riesgo.
Ver §5 del documento consolidado.

## Licencia

Propietario. © DéjateLlevar.
