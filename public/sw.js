// public/sw.js
const CACHE_NAME = 'icity-offline-cache-v2';
const OFFLINE_URL = '/offline';

// 1. Install Phase: Download and cache the new offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // 'reload' forces the browser to fetch the newest version from the server, ignoring its normal cache
      await cache.add(new Request(OFFLINE_URL, { cache: 'reload' }));
    })()
  );
  self.skipWaiting(); // Force the waiting service worker to become the active service worker.
});

// 2. Activate Phase: Clean up old caches (v1)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if ('navigationPreload' in self.registration) {
        await self.registration.navigationPreload.enable();
      }
      
      // Look at all the caches and delete anything that isn't v2
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })()
  );
  self.clients.claim(); // Claim control immediately
});

// 3. Fetch Phase: Intercept network requests
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const preloadResponse = await event.preloadResponse;
          if (preloadResponse) return preloadResponse;
          
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          console.log('[Service Worker] Network failed, serving offline page.');
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(OFFLINE_URL);
          return cachedResponse;
        }
      })()
    );
  }
});