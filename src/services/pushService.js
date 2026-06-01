/**
 * pushService.js
 *
 * Implementación exacta basada en suscripcion.js del ingeniero líder.
 * Diferencias integradas:
 *  - API_BASE apunta a https://elprofehugo.online/api/v1
 *  - JWT leído de localStorage con clave "jwt_token" (igual que authStore)
 *  - SW registrado en /sw.js (ruta raíz, generada por Vite PWA)
 *  - Body enviado como JSON.stringify(subscription) — objeto PushSubscription directo
 *  - Respuesta exitosa esperada: HTTP 204 No Content
 */

const API_BASE = `${import.meta.env.VITE_API_BASE_URL || 'https://elprofehugo.online'}/api/v1`

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export async function subscribeToPush() {
  // Guard: need JWT (key must match authStore TOKEN_KEY = "jwt_token")
  const token = localStorage.getItem('jwt_token')
  if (!token) {
    throw new Error('No hay token JWT. Haz login primero.')
  }

  // Guard: browser support
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Este navegador no soporta Service Worker o Push API.')
  }

  // 1. Request permission (RNF04)
  console.log('[push] solicitando permiso de notificaciones...')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Permiso de notificaciones no concedido.')
  }

  // 2. Register SW and wait until ready
  // Vite PWA outputs the built SW at /sw.js (root)
  console.log('[push] registrando service worker...')
  await navigator.serviceWorker.register('/sw.js')
  await navigator.serviceWorker.ready

  // 3. Fetch VAPID public key — GET /api/v1/push/key
  const keyResponse = await fetch(`${API_BASE}/push/key`)
  if (!keyResponse.ok) {
    const text = await keyResponse.text()
    throw new Error(`No se obtuvo VAPID key (${keyResponse.status}): ${text}`)
  }

  const { publicKey } = await keyResponse.json()
  if (!publicKey) {
    throw new Error('Respuesta inválida de /push/key: falta campo publicKey')
  }

  // 4. Subscribe (reuse existing subscription if present)
  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    console.log('[push] creando suscripción push...')
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    })
  }

  // 5. Send subscription to backend — POST /api/v1/push/subscriptions
  // Body: JSON.stringify(subscription) — raw PushSubscription object
  // Expected response: 204 No Content
  console.log('[push] enviando suscripción al backend...')
  const saveResponse = await fetch(`${API_BASE}/push/subscriptions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(subscription),
  })

  if (saveResponse.status !== 204) {
    const text = await saveResponse.text()
    throw new Error(`No se guardó suscripción (${saveResponse.status}): ${text}`)
  }

  console.log('[push] suscripción push registrada.')
}
