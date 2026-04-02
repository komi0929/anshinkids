const CACHE_NAME = 'anshin-kids-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/talk',
  '/wiki',
  '/manifest.json',
  '/apple-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
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
  // GETリクエストのみキャッシュ
  if (event.request.method !== 'GET') return;
  // Supabaseや外部APIなどはキャッシュしない
  if (event.request.url.includes('supabase.co') || event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // ネットワーク優先 (Stale-While-Revalidateパターン)
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }
        // レスポンスをキャッシュに保存して更新
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
        // ネットワークが死んでいる場合はここでハンドリング
        // キャッシュがあればそれが返り、なければエラーになる
      });
      
      // キャッシュがあれば即座に返し、裏でfetchPromiseを走らせる
      // キャッシュがなければfetchPromiseの結果を待つ
      return cachedResponse || fetchPromise;
    })
  );
});
