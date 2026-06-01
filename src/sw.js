// ── Workbox precache injection (vite-plugin-pwa injectManifest) ──
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute, NavigationRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'

cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST || [])

// SPA navigation fallback
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'censopet-shell',
      networkTimeoutSeconds: 5,
    })
  )
)

// Static assets cache
registerRoute(
  ({ request }) => ['style', 'script', 'worker'].includes(request.destination),
  new StaleWhileRevalidate({ cacheName: 'censopet-assets' })
)

// API GET cache for census map
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/v1/censos'),
  new NetworkFirst({ cacheName: 'censopet-api', networkTimeoutSeconds: 8 })
)

// ── Push listener — implementación exacta de sw_suscripcion.js del ingeniero líder ──
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = {};
  }

  const notification = payload.notification || {};
  const title = notification.title || "Nueva notificación";
  const options = {
    body: notification.body || "",
    icon: notification.icon || "/pwa3/icons/icon-192.png",
    data: notification.data || { url: "/pwa3/mapa" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── notificationclick — implementación exacta de sw_suscripcion.js del ingeniero líder ──
// Construye la URL con ?idCenso= para deeplink al mapa (CP-05)
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const baseUrl = data.url || "/pwa3/mapa";
  const targetUrl = data.idCenso
    ? `${baseUrl}?idCenso=${encodeURIComponent(data.idCenso)}`
    : baseUrl;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return null;
    }),
  );
});

// Skip waiting on demand
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})
