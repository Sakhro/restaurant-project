const staticCacheName = 'v3';
const contentImgsCache = 'content-imgs';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName).then( (cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/manifest.json',
                'client/css/styles.css',
                'client/css/media-500.css',
                'client/css/media-1024.css',
                'client/js/idb.js',
                'client/js/dbhelper.js',
                'client/js/main.js',
                'client/js/restaurant_info.js',
                'https://use.fontawesome.com/releases/v5.0.8/css/all.css',
            ]);
        }).catch( (error) => {
            console.log(error);
        })
    );
});

self.addEventListener('fetch', (event) => {
    let requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/restaurant')) {
            event.respondWith(caches.match('/restaurant.html'));
            return;
        }
        if (requestUrl.pathname.startsWith('/client/img/')) {
            event.respondWith(servePhoto(event.request));
            return;
        }
    }

    event.respondWith(
        caches.match(event.request).then(function(response) {
            return response || fetch(event.request);
        })
    );
});

servePhoto = request => {
    const storageUrl = request.url.replace(/-\dx\.jpg$/, '');
    return caches.open(contentImgsCache).then( cache => {
        return cache.match(storageUrl).then( response => {
            if (response) return response;

            return fetch(request).then( networkResponse => {
                cache.put(storageUrl, networkResponse.clone());
                return networkResponse;
            })
        } )
    })
}