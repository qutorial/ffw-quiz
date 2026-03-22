// FFW Quiz App — Service Worker Template
// Cache name uses 3.21.0 placeholder — replaced by assemble.py at build time.
// Strategy: cache-first with silent network update.
// No prompts, no toasts — transparent to the user.

var CACHE_NAME = 'ffw-quiz-3.21.0';
var APP_URL = self.location.origin + '/';

// Install: cache the app shell (index.html at root URL)
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.add(APP_URL);
    })
  );
  // Take over immediately — don't wait for old SW to expire
  self.skipWaiting();
});

// Activate: delete all caches that don't match the current version
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      // Take control of all open clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch: serve from cache first; on cache miss fetch from network and update cache
self.addEventListener('fetch', function(event) {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      // Serve cached version immediately if available
      if (cached) {
        // Silently update cache in the background
        fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch(function() { /* network unavailable — cached version still served */ });
        return cached;
      }
      // Cache miss: fetch from network, cache the result, return it
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return networkResponse;
      });
    })
  );
});
