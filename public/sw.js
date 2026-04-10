const CACHE_NAME = 'anshin-kids-v2';
const ASSETS_TO_CACHE = [
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual add() calls with error handling to prevent one 404 from breaking everything
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) => cache.add(url).catch(() => console.warn('[SW] Failed to cache:', url)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  // Don't cache API/Supabase/auth requests
  const url = event.request.url;
  if (url.includes('supabase.co') || url.includes('/api/') || url.includes('/auth/')) return;
  // Don't cache server actions or Next.js React Server Components payloads
  if (event.request.headers.get('next-action')) return;
  if (url.includes('_rsc=') || url.includes('?_rsc') || event.request.headers.get('RSC') || event.request.headers.get('Next-Router-Prefetch')) return;
  
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      // Network failed, try cache
      return caches.match(event.request);
    })
  );
});
