const staticCacheName = 'v1';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName).then( (cache) => {
            return cache.addAll([
                '/',
                'css/styles.css',
                'data/restaurants.json',
                'js/dbhelper.js',
                'js/swcontroller.js',
                'js/main.js',
                'js/restaurant_info.js',
            ]);
        }).catch( (error) => {
            console.log(error);
        })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});