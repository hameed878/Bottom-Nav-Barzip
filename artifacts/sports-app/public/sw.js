// XRT Service Worker — v1.1.0
const CACHE_NAME = 'xrt-v1';
const OFFLINE_URL = '/offline.html';

// Assets to pre-cache on install (includes offline page so it's always available)
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API/admin requests — always go to network, never cache
  if (request.method !== 'GET') return;
  if (url.pathname.startsWith('/api') || url.pathname.startsWith('/admin')) return;

  // Network-first for HTML navigation (always fresh app shell)
  // On failure, serve the dedicated offline page (which is always precached)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((res) => res || new Response('Offline', { status: 503 }))
      )
    );
    return;
  }

  // Cache-first for static assets (images, fonts, icons)
  if (url.pathname.match(/\.(png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf)$/)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
            return res;
          })
      )
    );
    return;
  }

  // JS/CSS: network-first, fall back to cache so offline shell stays coherent
  if (url.pathname.match(/\.(js|css|mjs)$/)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Default: network with cache fallback
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});
