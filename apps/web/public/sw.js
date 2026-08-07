/* Service Worker de DéjateLlevar — soporte offline con persistencia de la shell.
 * Estrategias:
 *  - Navegaciones (páginas): network-first con respaldo a caché y a /offline.
 *  - GET de /api: stale-while-revalidate (muestra lo último y refresca en 2.º plano).
 *  - Estáticos (/_next/static, /icons): cache-first.
 * Sube CACHE_VERSION en cada cambio para invalidar cachés viejas.
 */
const CACHE_VERSION = 'dl-v1';
const SHELL_CACHE = `${CACHE_VERSION}-shell`;
const DATA_CACHE = `${CACHE_VERSION}-data`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE = ['/', '/buscar', '/offline', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith('/_next/static') ||
    url.pathname.startsWith('/icons') ||
    url.pathname.startsWith('/assets') ||
    /\.(png|jpg|jpeg|svg|webp|woff2?|ico|css|js)$/.test(url.pathname)
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return; // las escrituras nunca se cachean

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navegaciones → network-first, cae a caché y luego a /offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match('/offline'))),
    );
    return;
  }

  // API GET → stale-while-revalidate
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached ?? network;
      }),
    );
    return;
  }

  // Estáticos → cache-first
  if (isStatic(url)) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res.ok) cache.put(request, res.clone());
        return res;
      }),
    );
  }
});
