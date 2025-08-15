// 后台播放服务
self.addEventListener('fetch', event => {
    // 允许音频请求通过
    if (event.request.url.includes('.mp3') || 
        event.request.url.includes('.m4a') ||
        event.request.url.includes('.aac')) {
        event.respondWith(fetch(event.request));
    }
});

self.addEventListener('message', event => {
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open('audio-cache').then(cache => {
                return cache.addAll(event.data.payload);
            })
        );
    }
});

self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim());
});