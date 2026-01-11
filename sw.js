const CACHE_NAME = 'impostor-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;800&display=swap'
];

// 1. Install Phase
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Intenta cachear lo crítico, pero no falles si alguna URL externa falla
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
         console.warn("Algunos recursos no se pudieron cachear en la instalación:", err);
      });
    })
  );
  self.skipWaiting();
});

// 2. Activate Phase (Cleanup old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Phase (Network First, fall back to Cache)
self.addEventListener('fetch', (event) => {
  // Solo interceptar peticiones GET http/https
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la red responde bien, guardamos una copia en caché y devolvemos la respuesta
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si la red falla (offline), buscamos en caché
        return caches.match(event.request);
      })
  );
});