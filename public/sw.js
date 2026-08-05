const CACHE_NAME = 'military-app-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Event - Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core app shell for offline support');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('[SW] Caching non-critical asset failed:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean Up Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing stale cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Stale-While-Revalidate & Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests or browser extension URLs
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // Exclude chrome-extension or external analytics
  if (url.protocol.startsWith('chrome-extension')) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Try network first
      try {
        const networkResponse = await fetch(event.request);
        // Save copy in cache for offline use if valid response
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (error) {
        // Network failed (Offline mode) -> return cached version
        console.log('[SW] Network request failed. Serving cached asset:', event.request.url);
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If navigated to a page offline, return index.html (SPA fallback)
        if (event.request.mode === 'navigate') {
          const indexFallback = await cache.match('/index.html') || await cache.match('/');
          if (indexFallback) {
            return indexFallback;
          }
        }

        throw error;
      }
    })
  );
});
