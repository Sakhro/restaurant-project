const staticCacheName = 'v1';
const contentImgsCache = 'content-imgs';

const allCaches = [
    staticCacheName,
    contentImgsCache
]

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(staticCacheName).then( (cache) => {
            return cache.addAll([
                '/',
                '/index.html',
                '/restaurant.html',
                '/manifest.json',
                'css/styles.css',
                'js/idb.js',
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
    let requestUrl = new URL(event.request.url);
    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/img/')) {
            event.respondWith(servePhoto(event.request))
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