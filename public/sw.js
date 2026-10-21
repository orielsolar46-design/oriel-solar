/* eslint-disable no-undef */
/**
 * Oriel Back Office — service worker.
 *
 * Two jobs, and deliberately no more:
 *
 * 1. Deliver a notification the moment an order lands, the way a messaging app
 *    does. The owner keeps the app on his home screen and does not open it
 *    hourly; the notification IS the product.
 * 2. Keep the shell openable on a bad signal, so tapping the icon in a store
 *    room with one bar shows something rather than the browser's error page.
 *
 * There is no aggressive caching of admin data. Stale order figures would be
 * worse than a spinner — a person acting on yesterday's list at a customer's
 * gate is the failure this avoids.
 */

const SHELL_CACHE = 'oriel-shell-v1';
const SHELL_ASSETS = ['/app/icon-192.png', '/app/icon-512.png', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== SHELL_CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Network first, always. The cache is a fallback for when the network fails,
 * never a substitute for it.
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never serve an API response from cache — figures must be live.
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (SHELL_ASSETS.includes(url.pathname) && response.ok) {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return new Response(
            `<!doctype html><meta charset="utf-8">
             <meta name="viewport" content="width=device-width,initial-scale=1">
             <title>No signal</title>
             <body style="margin:0;display:grid;place-items:center;height:100vh;
                          background:#F4F6FB;color:#0A1733;
                          font:15px/1.5 system-ui,sans-serif;text-align:center;padding:24px">
               <div>
                 <p style="font-size:17px;font-weight:600;color:#0B2A6B;margin:0 0 4px">
                   No signal
                 </p>
                 <p style="margin:0;color:#5A6784">
                   The back office needs a connection. Try again when you have one.
                 </p>
               </div>
             </body>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        }
        return Response.error();
      })
  );
});

/**
 * A new order arrived. Shown with a tag so a burst of orders collapses into one
 * line rather than a stack the owner has to dismiss one at a time, and with
 * `renotify` so each one still buzzes.
 */
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'New order', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'New order';
  const options = {
    body: payload.body || '',
    icon: '/app/icon-192.png',
    badge: '/app/icon-192.png',
    tag: payload.tag || 'oriel-order',
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    timestamp: Date.now(),
    data: { url: payload.url || '/admin/orders' },
    actions: [{ action: 'open', title: 'Open the order' }],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Tapping the notification focuses the app if it is already open rather than
 * stacking a second window, then navigates it to the order.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/admin/orders';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/admin') && 'focus' in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
