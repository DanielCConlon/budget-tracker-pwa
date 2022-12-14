const CACHE_NAME = 'budget-tracker-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

const FILES_TO_CACHE = [
  "/index.html",
  "/css/styles.css",
  "/js/index.js",
  "/js/idb.js",
  "/manifest.json"
];

// Install the service worker
self.addEventListener('install', function(evt) {
  evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
          console.log('Your files were pre-cached successfully!');
          return cache.addAll(FILES_TO_CACHE);
      })
  );
  self.skipWaiting();
});

// Activate the service worker and remove old data from the cache
self.addEventListener('activate', function(evt) {
  evt.waitUntil(
      caches.keys().then(keylist => {
          return Promise.all(
              keylist.map(key => {
                  if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                      console.log('Removing old cache data', key);
                      return caches.delete(key);
                  }
              })
          );
      })
  );
  self.clients.claim();
});


// Intercept fetch requests
self.addEventListener('fetch', function(evt) {
  if (evt.request.url.includes('api')) {
      evt.respondWith(
          caches
              .open(DATA_CACHE_NAME)
              .then(cache => {
                  return fetch(evt.request)
                      .then(response => {
                          // if response was good, clone it and store it in the cahce.
                          if (response.status === 200) {
                              cache.put(evt.request.url, response.clone());
                          }
                          return response;
                      })
                      .catch(err => {
                          // network request failed, try to get it from teh cache
                          return cache.match(evt.request);
                      });
              })
              .catch(err => console.log(err))
      );
      return;
  }

  evt.respondWith(
      fetch(evt.request).catch(function() {
          return caches.match(evt.request).then(function(response) {
              if (response) {
                  return response;
              }
              else if
              (evt.request.headers.get('accept').includes('text/html')) {
                  // return the cached home page for all request for html pages
                  return caches.match('/');
              }
          });
      })
  )
});