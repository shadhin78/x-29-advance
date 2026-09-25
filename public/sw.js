/**
 * X-29 Production PWA Service Worker (public/sw.js)
 * 
 * Capabilities:
 * 1. Precaches app shell, core offline routes, icons, and manifest.
 * 2. Network-first strategy with cache fallback for navigation requests.
 * 3. Stale-while-revalidate / Cache-first strategy for Next.js static assets, styles, scripts, fonts, and images.
 * 4. Cache-first strategy for audio assets (timer bell and ambient sounds).
 * 5. Direct bypass for Firestore, Firebase Auth, Google APIs, and /api/* endpoints so IndexedDB handles offline sync natively without SW interference.
 * 6. Automated cache cleanup on activation and skipWaiting lifecycle support.
 */

const CACHE_NAME = 'x29-pwa-v2';

const STATIC_ROUTES = [
  '/',
  '/focus',
  '/daily-actions',
  '/daily-actions/monthly-setup',
  '/schedule',
  '/subjects',
  '/pace',
  '/outcome',
  '/exam',
  '/master-config',
  '/analytics',
  '/login',
];

const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/x-29-adv-logo.jpeg',
  '/icons/logo-sticker.png',
];

const PRECACHE_LIST = [...STATIC_ROUTES, ...STATIC_ASSETS];

// Install: Precache shell and assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Use Promise.allSettled so transient 404s or dev-only issues do not abort SW installation
      await Promise.allSettled(
        PRECACHE_LIST.map((url) =>
          fetch(url, { cache: 'no-cache' })
            .then((res) => {
              if (res.ok) {
                return cache.put(url, res);
              }
            })
            .catch((err) => {
              console.warn(`[SW] Precache skipped for ${url}:`, err.message);
            })
        )
      );
    })
  );
  self.skipWaiting();
});

// Activate: Invalidate and purge old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key.startsWith('x29-') && key !== CACHE_NAME) {
            console.log(`[SW] Deleting legacy cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Strategy dispatch
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle GET requests
  if (req.method !== 'GET') {
    return;
  }

  // 2. Direct Network Bypass: Firebase / Firestore / Google APIs / REST APIs
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.pathname.startsWith('/api/') ||
    url.protocol === 'chrome-extension:'
  ) {
    return;
  }

  // 3. Navigation Requests: Network-First with Cache Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;

          // Route fallback if exact URL not in cache
          const focusFallback = await caches.match('/focus');
          if (focusFallback) return focusFallback;

          const rootFallback = await caches.match('/');
          if (rootFallback) return rootFallback;

          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>X-29 Offline</title><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="background:#0b0f19;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;"><div style="text-align:center;padding:20px;"><h2>X-29 Offline Mode</h2><p>Application shell is ready. Please launch <a href="/focus" style="color:#38bdf8;">Focus Studio</a>.</p></div></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 4. Next.js Static Chunks, CSS, JS, Fonts & Images: Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    req.destination === 'style' ||
    req.destination === 'script' ||
    req.destination === 'worker' ||
    req.destination === 'font' ||
    req.destination === 'image' ||
    req.destination === 'audio';

  if (isStaticAsset) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        const fetchPromise = fetch(req)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 5. Default Fallback: Network with Cache Fallback
  event.respondWith(
    fetch(req).catch(() => caches.match(req))
  );
});

// Message listener for immediate skipWaiting trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
