# Publicar DéjateLlevar en Google Play y App Store

La app móvil (Expo + expo-router) está configurada para compilarse y publicarse en
**Android (Google Play)** e **iOS (App Store)** con **EAS** (Expo Application Services).
Esta guía es lo único que falta por hacer, y requiere **tus cuentas** (yo dejé todo lo
técnico listo).

## Lo que ya quedó configurado

- `app.json`: nombre, identificadores (`com.dejatellevar.app` en iOS y Android), versión,
  icono, icono adaptativo (Android), splash, orientación y colores de marca.
- `eas.json`: perfiles de build `development`, `preview` y `production`, y `submit` para
  ambas tiendas. El build de producción de Android genera **App Bundle (.aab)**.
- `assets/`: icono 1024×1024, icono adaptativo, splash y favicon (marca "Horizonte al
  atardecer"). Puedes reemplazarlos por arte final cuando lo tengas.
- Scripts en `package.json` (`build:android`, `build:ios`, `submit:*`, etc.).
- La app apunta por defecto a la API de producción (`https://dajate-llevar-app.vercel.app/api`).

## Requisitos (una sola vez)

| Necesitas | Para qué | Costo |
|---|---|---|
| Cuenta **Expo** (gratis) | Ejecutar EAS Build/Submit | Gratis |
| Cuenta **Apple Developer** | Publicar en App Store | US$99/año |
| Cuenta **Google Play Console** | Publicar en Google Play | US$25 (pago único) |
| Un **Mac** (opcional) | Solo si quieres compilar iOS localmente; **con EAS no hace falta**, compila en la nube | — |

## Paso a paso

Todos los comandos se corren **dentro de `apps/mobile/`**.

### 1. Iniciar sesión y enlazar el proyecto con Expo

```bash
npm i -g eas-cli        # si no lo tienes
eas login               # con tu cuenta Expo
eas init                # crea el proyecto en Expo y escribe extra.eas.projectId en app.json
```

### 2. (Recomendado) Probar un build interno antes de las tiendas

```bash
pnpm --filter @dejatellevar/mobile build:preview
```
Esto genera un **APK** de Android y un build de iOS para pruebas internas (te da un enlace
para instalarlo). Sirve para validar antes de enviar a revisión.

### 3. Compilar para producción

```bash
# Ambas plataformas a la vez:
pnpm --filter @dejatellevar/mobile build:all
# o por separado:
pnpm --filter @dejatellevar/mobile build:android
pnpm --filter @dejatellevar/mobile build:ios
```
EAS gestiona automáticamente las **credenciales de firma** (keystore de Android y
certificados de iOS) — la primera vez te preguntará; deja que EAS las cree y las guarde.

### 4. Android — configurar el envío a Google Play

1. En Google Play Console, crea la app (paquete `com.dejatellevar.app`).
2. Crea una **cuenta de servicio** con permiso de publicación y descarga su JSON.
3. Guarda ese archivo como `apps/mobile/google-play-service-account.json`
   (ya está en `.gitignore`; **nunca** se sube a git).
4. Sube la primera versión manualmente **una vez** (requisito de Google), luego:
```bash
pnpm --filter @dejatellevar/mobile submit:android
```

### 5. iOS — configurar el envío a App Store

1. En App Store Connect, crea la app (bundle `com.dejatellevar.app`) y anota su **App ID**.
2. En `eas.json` → `submit.production.ios`, reemplaza `appleId`, `ascAppId` y `appleTeamId`.
3. Envía:
```bash
pnpm --filter @dejatellevar/mobile submit:ios
```

### 6. Actualizaciones futuras

Sube `version` en `app.json` en cada release. Los números de build se autoincrementan
(`autoIncrement` + `appVersionSource: remote`). Repite build + submit.

## Assets de la ficha de tienda (los pides aparte)

Cada tienda exige, además del binario:
- **Capturas de pantalla** (varios tamaños de teléfono y tablet).
- Descripción, categoría, política de privacidad (usa `/legal/privacidad` del sitio).
- Clasificación de contenido.

Puedo ayudarte a generarlas cuando las pantallas estén listas.

## Nota de arquitectura

DéjateLlevar es multiplataforma por diseño: la lógica vive en `packages/core`,
`packages/contracts` y la API, que la web y la app móvil comparten. **Toda funcionalidad
nueva debe seguir funcionando en web + iOS + Android** (ver `CLAUDE.md`).
