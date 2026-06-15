// ECB Scouting POC — Service Worker
// Pages: network-first (always fresh when online, cache fallback offline).
// Assets (images/fonts): cache-first for speed.
const CACHE = 'ecb-poc-v14';
const ASSETS = [
  './install.html',
  './index.html',
  './home.html',
  './report.html',
  './compare.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './avatar-bc.png',
  './avatar-women.png',
  './avatar-women2.png',
  './avatar-teen.png',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // HTML navigations: network-first so updates appear on next open
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() =>
          caches.match(e.request).then(m => m || caches.match('./index.html'))
        )
    );
    return;
  }
  // Everything else: cache-first, then network (cached for next time)
  e.respondWith(
    caches.match(e.request).then(cached =>
      cached ||
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => cached)
    )
  );
});
