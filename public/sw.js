// FitCircle's service worker. It only shows push notifications and opens the app when one is tapped.
// It deliberately caches nothing, so a new deploy is always picked up on the next load.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    message = { body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(message.title || 'FitCircle', {
      body: message.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      // The same tag replaces an older notification of the same kind instead of piling up.
      tag: message.tag,
      data: { url: message.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/', self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.startsWith(self.location.origin));
      if (open) return open.focus().then((client) => client.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
