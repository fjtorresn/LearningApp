// Service worker de LearningApp: permite consultar tus tarjetas sin conexión.
//
// Estrategia "network first": siempre intenta la red (datos frescos) y, si falla,
// responde con la última copia guardada. Solo se registra en producción (npm run build && npm start).

const VERSION = "v1";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const API = "api"; // AppShell lo borra al cerrar sesión

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  // Borra cachés de versiones anteriores del service worker.
  const keep = [PAGES, ASSETS, API];
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !keep.includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) (await caches.open(ASSETS)).put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, API));
  } else if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/")) {
    // Los archivos de /_next/static llevan un hash en el nombre: nunca cambian.
    event.respondWith(cacheFirst(request));
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, PAGES));
  }
});
