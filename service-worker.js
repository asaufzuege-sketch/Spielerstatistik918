const CACHE_NAME = 'smarthockey-918-v2-fix-' + Date.now();
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './season_table_styles.css',
  './season_map_momentum.css',
  './js/app.js',
  './js/core/config.js',
  './js/core/helpers.js',
  './js/utils/storage.js',
  './js/utils/marker-handler.js',
  './js/modules/team-selection.js',
  './js/modules/player-selection.js',
  './js/modules/stats-table.js',
  './js/modules/season-table.js',
  './js/modules/goal-map.js',
  './js/modules/season-map.js',
  './js/modules/goal-value.js',
  './js/modules/line-up.js',
  './js/modules/csv-handler.js',
  './js/modules/timer.js',
  './js/modules/page-info.js',
  './js/modules/theme-toggle.js',
  './season_table_ui_patch.js',
  './season_map_momentum.js',
  './enhancements-wakelock.js',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.log('Cache addAll failed:', err);
      })
  );
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
      .catch(() => {
        // Offline fallback
        if (event.request.destination === 'document') {
          return caches.match('./index.html');
        }
      })
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});
