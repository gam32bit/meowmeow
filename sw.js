// =============================================================================
// sw.js — service worker for offline play. Caches the app shell on install and
// serves cache-first, falling back to the network. Bump CACHE when files change.
// =============================================================================

const CACHE = 'meowmeow-v3';

const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/style.css',
  './src/main.js',
  './src/config.js',
  './src/state.js',
  './src/art.js',
  './src/spawner.js',
  './src/entities/cat.js',
  './src/entities/grandma.js',
  './src/systems/render.js',
  './src/systems/input.js',
  './src/systems/audio.js',
  './src/systems/layout.js',
  './src/systems/storage.js',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/dragon-studio-cute-cat-meow-472372.mp3',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(
      (hit) =>
        hit ||
        fetch(e.request)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
            return res;
          })
          .catch(() => caches.match('./index.html'))
    )
  );
});
