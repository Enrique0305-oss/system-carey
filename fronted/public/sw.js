// Un Service Worker básico para que el navegador reconozca la aplicación como instalable (PWA)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Solo pasamos la petición para que la red responda normalmente, 
  // no cacheamos nada para no interferir con las peticiones a la API o estado de Next.js
  event.respondWith(fetch(event.request).catch(() => {
    return new Response('Red no disponible');
  }));
});
