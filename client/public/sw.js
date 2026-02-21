const CACHE_NAME = 'vitaview-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest-dark.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-192x192-dark.png',
  '/icon-512x512-dark.png',
  '/apple-touch-icon.png',
  '/apple-touch-icon-dark.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip external resources - let the browser handle them directly
  // This prevents CSP violations for cross-origin requests like fonts
  if (url.origin !== self.location.origin) {
    return;
  }

  // Network-first strategy for API calls
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // You could return a custom offline JSON response here
          return new Response(JSON.stringify({ error: 'Offline' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // Stale-while-revalidate for same-origin requests only
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Update cache
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // If fetch fails and we have a cached response, use it
          return cachedResponse;
        });
        return cachedResponse || fetchPromise;
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
