// Sri Sai Dental Care — Service Worker
// Version: bump this string whenever you deploy a new build
const CACHE_NAME = 'sri-sai-dental-v1';

// Files to cache on install (app shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// ── Install: cache app shell ─────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting(); // activate immediately
});

// ── Activate: delete old caches ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim(); // take control of all open tabs
});

// ── Fetch: Network-first for API calls, Cache-first for assets ───────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Always go network-first for Google Apps Script API calls
  if (
    url.hostname === 'script.google.com' ||
    url.hostname === 'sheets.googleapis.com' ||
    url.pathname.includes('exec')
  ) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ success: false, error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    );
    return;
  }

  // Cache-first for everything else (HTML, CSS, JS, images)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Only cache valid same-origin responses
        if (
          !response ||
          response.status !== 200 ||
          response.type !== 'basic'
        ) {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache =>
          cache.put(event.request, responseClone)
        );
        return response;
      }).catch(() => {
        // Fallback to index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
