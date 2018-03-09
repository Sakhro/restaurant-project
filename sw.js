const staticCacheName = 'v2';
const contentImgsCache = 'content-imgs';


self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName).then( (cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/manifest.json',
                'css/styles.css',
                'css/media-500.css',
                'css/media-1024.css',
                'js/idb.js',
                'js/dbhelper.js',
                'js/main.js',
                'js/restaurant_info.js'
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
        if (requestUrl.pathname.startsWith('/img/')) {
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