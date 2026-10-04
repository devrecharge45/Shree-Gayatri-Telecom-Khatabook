const CACHE_NAME = 'khatabook-v3';
const STATIC_ASSETS = [
  '/',
  '/parties',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/pages/auth.css',
  '/css/pages/parties.css',
  '/css/pages/ledger.css',
  '/css/pages/profile.css',
  '/js/app.js',
  '/js/pwa-installer.js',
  '/images/logo.png',
  '/images/favicon.png',
  '/images/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Network-first strategy: always fetch freshest assets, fallback to cache when offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkRes) => {
        if (networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, resClone);
          });
        }
        return networkRes;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match('/parties');
        });
      })
  );
});
