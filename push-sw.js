// Service worker dedicato alle notifiche push (scope separato da quello di Flutter).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let d = {};
  try { d = event.data ? event.data.json() : {}; } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(d.titolo || 'Matiss', {
      body: d.testo || 'Nuova richiesta',
      icon: 'icons/Icon-192.png',
      badge: 'icons/Icon-192.png',
      tag: d.tag || 'richiesta',
      data: { url: './' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const lista = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of lista) {
      if ('focus' in c) return c.focus();
    }
    return self.clients.openWindow((event.notification.data && event.notification.data.url) || './');
  })());
});
