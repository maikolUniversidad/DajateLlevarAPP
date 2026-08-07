# CLAUDE.md — DéjateLlevar

Guía para trabajar en este repositorio. Léela antes de tocar código. La
especificación completa está en `docs/`:

- `docs/00-documento-consolidado.md` — negocio, mercado, dominio, cumplimiento legal.
- `docs/01-especificacion-tecnica.md` — diseño, modelo de datos, vistas, API.

## Qué es

Sistema operativo comercial para servicios y creadores de contenido. Mercado
inicial: Villavicencio y el Meta, Colombia. Marketplace de dos lados (empresas +
clientes) con capa de creadores activable. El diferenciador es el **Índice de
Fidelidad Promocional** (eje Expectativa vs Realidad, −3 a +3).

## Reglas de código innegociables

1. **DINERO**: enteros en centavos, siempre. `Money = { amount: number, currency }`.
   En BD `bigint`. Nunca float, nunca decimales en el transporte.
2. **FECHAS**: `timestamptz`, almacenamiento en UTC. `America/Bogota` solo al presentar.
3. **IDs**: UUID. Nunca enteros autoincrementales expuestos.
4. **MULTI-INQUILINO**: `organizationId` explícito en cada método de repositorio, más
   RLS activo en Postgres.
5. **EVENTOS**: ningún cambio de estado importante sin escribir en `domain_event`.
   Append-only: nada de UPDATE ni DELETE.
6. **ERRORES**: los casos de uso devuelven `Result<T, E>`. Excepciones solo para fallas imprevistas.
7. **ENTORNO**: variables validadas con Zod al arrancar (`packages/config/env`). Si falta una, no levanta.
8. **Tokens** en cookies httpOnly. Nada sensible en localStorage.

## La regla de oro: portabilidad

`packages/core` **NUNCA** importa Next.js, Vercel, Supabase, React ni ningún SDK de
proveedor. Solo TypeScript, Zod y sus tipos. Para hablar con el exterior define un
**puerto** (interfaz) y otro paquete lo implementa.

- Consultas con **Drizzle** sobre Postgres estándar, no con el cliente de Supabase.
- `AuthProvider` → adaptador `SupabaseAuthProvider` (en `packages/db/adapters`).
- `StorageProvider` → adaptador Supabase Storage.
- `PaymentProvider` → adaptador **Wompi**. Stripe NO opera en Colombia.
- API con **Hono**, montada en Next en `app/api/[[...route]]/route.ts`.
- Next con `output: "standalone"` desde el día uno.

## Mandato multiplataforma: web + iOS + Android (INNEGOCIABLE)

DéjateLlevar se publica en **web (Vercel)**, **Android (Google Play)** e **iOS
(App Store)**. Toda funcionalidad nueva debe quedar disponible en las tres, o dejar el
camino trazado para ello. Cómo se cumple sin duplicar lógica:

- **La lógica de negocio nunca vive en una app.** Vive en `packages/core`,
  `packages/contracts` y la API (Hono). Web y móvil solo consumen la API con el mismo
  cliente tipado. Si escribes una regla en un componente, está en el lugar equivocado.
- **`apps/mobile` (Expo + expo-router)** es la app nativa. Se compila y publica con **EAS**
  (`eas.json`, `apps/mobile/app.json`). Guía completa en `apps/mobile/PUBLISHING.md`.
- **Cada endpoint o contrato nuevo** debe poder llamarse igual desde la web y desde el
  móvil. Nada de acoplar respuestas a detalles de un solo cliente.
- **Identificadores de tienda:** `com.dejatellevar.app` (iOS y Android). No cambiarlos.
- Al terminar una feature, pregúntate: ¿funciona en la web desplegada Y en un build de EAS?
  Si el móvil aún no tiene la pantalla, al menos la API/contrato deben estar listos para él.

## Estructura

```
apps/web        Next.js 15 App Router + Tailwind + shadcn/ui
apps/mobile     Expo + expo-router + NativeWind
packages/core   Dominio puro: entidades, casos de uso, puertos
packages/db     Drizzle: esquema, migraciones SQL, RLS, seed, repositorios, adaptadores
packages/api    Hono + Zod + OpenAPI 3.1
packages/contracts  Esquemas Zod compartidos (fuente de verdad de tipos)
packages/ui     Tokens de diseño y componentes (incluye FidelityMeter)
packages/config TypeScript, Tailwind y env compartidos
```

## Convenciones

- Tablas/columnas: `snake_case`, inglés. Archivos TS: `kebab-case.ts`. Componentes: `PascalCase.tsx`.
- Nombres de código en inglés; textos de usuario, comentarios de dominio y docs en **español de Colombia**.
- Commits pequeños, Conventional Commits (`feat:`, `fix:`, `chore:`...).
- Validación con Zod en **toda frontera**. Datos en cliente con TanStack Query.

## Comandos

```bash
pnpm install
pnpm db:local      # Postgres 16 + pgvector en docker
pnpm db:migrate    # aplica migraciones SQL en orden
pnpm db:seed       # datos semilla del Meta + verificación de cuadre del ledger
pnpm dev           # web + mobile
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Estado actual (Sesión 1 — cimientos)

Hecho:
- Monorepo pnpm + Turborepo + Biome + Lefthook.
- `packages/contracts`: Money, Address, Pagination, AccessibilityProfile, FidelityScore.
- `packages/core`: entidades, puertos, caso de uso `CreateBooking` con pruebas (fakes, sin red).
- `packages/db`: esquema completo (§4), enums (§3.1), índices, exclusión GiST anti-doble-reserva,
  RLS (§5), repositorios y seed del Meta con verificación de cuadre del ledger.
- `packages/ui`: tokens (§1), preset Tailwind, `FidelityMeter` accesible + primitivos.
- `packages/api`: Hono con middleware (auth, org, errores, idempotencia, rate-limit) y
  `GET /v1/services` + `POST /v1/services`, OpenAPI 3.1.
- `apps/web`: portada (P01) y búsqueda (P02) sobre la API real, con el sistema de diseño.
- `apps/mobile`: tabs de §7.7 y pantalla Explorar (M01).

Pendiente: módulos de negocio (identidad, agenda, pagos completos, reseñas, campañas,
atribución, interoperabilidad, MCP). Ver §10 del documento técnico para el orden.
