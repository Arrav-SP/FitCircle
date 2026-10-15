// FitCircle's service worker: shows push notifications, opens the app when one is tapped, and makes sure
// opening the app loads the latest deploy. It deliberately caches nothing.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Opening the app always fetches the page itself fresh, so a new deploy shows up straight away instead of a
// copy the browser kept. Everything else (code, icons) has versioned names and is left to the browser.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-cache' }));
  }
});

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
  // Only ever open FitCircle's own pages, whatever a notification says.
  let url = new URL(event.notification.data?.url || '/', self.location.origin);
  if (url.origin !== self.location.origin) url = new URL('/', self.location.origin);
  url = url.href;
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      const open = windows.find((client) => client.url.startsWith(self.location.origin));
      if (open) return open.focus().then((client) => client.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});
