const CACHE_NAME = 'saas-madura-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple fetch handler to satisfy PWA installability requirements
  // We don't cache anything aggressively to avoid staleness, just pass through.
  // If offline, we could serve an offline page if we had one.
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});
