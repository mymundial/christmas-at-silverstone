// Pass 6.80 service-worker retirement shim.
// This file intentionally does not cache or intercept requests.
// It exists for one deployment so browsers with an older Mission Control
// service worker can update to this version, purge legacy caches, and unregister.
const LEGACY_CACHE_PREFIX = 'mission-control-sleigh-';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key.startsWith(LEGACY_CACHE_PREFIX))
        .map(key => caches.delete(key))
    );

    await self.registration.unregister();

    const windows = await self.clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    });
    windows.forEach(client => client.navigate(client.url));
  })());
});
