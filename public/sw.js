/**
 * X-29 Service Worker (public/sw.js)
 * 
 * Provides:
 * - App Shell caching
 * - Static asset offline availability (icons, styles)
 * - Safe cache invalidation across versions
 * - Network-first strategy for dynamic data
 */

const CACHE_NAME = 'x29-shell-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/x-29-adv-logo.jpeg',
  '/icons/logo-sticker.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Do NOT intercept Firestore, Firebase auth, or API requests
  if (
    url.hostname.includes('firebaseio.com') ||
    url.hostname.includes('googleapis.com') ||
    url.pathname.startsWith('/api/')
  ) {
    return;
  }

  // Network-first for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match('/') || Response.error();
      })
    );
    return;
  }

  // Cache-first for images, fonts, and static assets
  if (
    event.request.destination === 'image' ||
    event.request.destination === 'font' ||
    event.request.destination === 'style'
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return (
          cached ||
          fetch(event.request).then((res) => {
            if (res.status === 200) {
              const clone = res.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, clone);
              });
            }
            return res;
          })
        );
      })
    );
  }
});
