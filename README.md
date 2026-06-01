# CensoPet PWA

Este repositorio contiene la PWA `CensoPet`. Está preparada para servir desde la ruta `/pwa3/` — `vite.config.js` tiene `base: '/pwa3/'` y el `manifest` y `service worker` usan la misma base.

Pasos rápidos:

- Instalar dependencias:
```bash
npm install
# o con pnpm
pnpm install
```
- Construir:
```bash
npm run build
```

Despliegue en servidor (ej. servir en https://proyectopwa.online/pwa3):

- Copiar el contenido de `dist/` a la carpeta pública del servidor en la ruta `/pwa3/`.
  Por ejemplo, con `rsync`:
```bash
rsync -av --delete dist/ user@server:/var/www/proyectopwa.online/pwa3/
```

- Configurar el servidor para fallback SPA (Nginx ejemplo):
```nginx
location /pwa3/ {
  root /var/www/proyectopwa.online;
  try_files $uri $uri/ /pwa3/index.html;
}
```

Si usas Apache, habilita `mod_rewrite` y crea un `.htaccess` con:
```apache
RewriteEngine On
RewriteBase /pwa3/
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule . /pwa3/index.html [L]
```

Subir a GitHub (crear repo y empujar):

1. Crear repo en GitHub (web o `gh`):
```bash
gh repo create <user>/<repo> --public --source=. --remote=origin
```
2. Empujar principal:
```bash
git push -u origin main
```

Publicar en GitHub Pages (opcional):

- Ya está configurado para una ruta base (`/pwa3/`). Usa `gh-pages` o Actions para publicar la carpeta `dist/` en `gh-pages`.
# CensoPet — PWA Censo de Mascotas

Progressive Web App para el registro y visualización geolocalizada de mascotas censadas. Construida con **Vue 3**, **Pinia**, **Vite PWA** y **Google Maps JS API**, con soporte offline mediante **IndexedDB** y notificaciones push via **Web Push + VAPID**.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Vue 3 (Composition API) |
| Estado global | Pinia |
| Router | Vue Router 4 |
| HTTP | Axios (interceptor JWT automático) |
| Offline storage | IndexedDB (via `idb`) |
| PWA / Service Worker | vite-plugin-pwa + Workbox (`injectManifest`) |
| Push notifications | Web Push API nativa del navegador |
| Mapas | Google Maps JS API (`@googlemaps/js-api-loader`) |
| Estilos | CSS Variables — tema oscuro con acento `#FFDD00` |

---

## Requisitos

- Node.js 20+
- Backend corriendo en `http://localhost:3000` (o configurar `VITE_API_BASE_URL`)
- API key de Google Maps con la API **Maps JavaScript API** habilitada

---

## Instalación y arranque

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con los valores reales

# 3. Modo desarrollo
npm run dev

# 4. Build de producción
npm run build
npm run preview
```

---

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_API_BASE_URL` | URL del backend (default: `http://localhost:3000`) |
| `VITE_PROYECTO_ID` | ID del proyecto asignado por el docente (RF06) |
| `VITE_PROYECTO_COLOR` | Color hex del proyecto (RF06, RF08) |
| `VITE_GOOGLE_MAPS_KEY` | API key de Google Maps (RF07) |

---

## Endpoints consumidos

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/login` | No | Login → JWT |
| `POST` | `/api/v1/personas/registro` | No | Registro con credenciales |
| `POST` | `/api/v1/personas` | No | Registro sin credenciales |
| `GET`  | `/api/v1/personas` | No | Listar para selector de censo |
| `POST` | `/api/v1/mascotas` | No | Registrar mascota |
| `GET`  | `/api/v1/mascotas` | No | Listar para selector de censo |
| `POST` | `/api/v1/censos` | **Sí** | Crear censo con foto+GPS |
| `GET`  | `/api/v1/censos` | No | Listar con DTO anidado para el mapa |
| `GET`  | `/api/v1/push/key` | No | Obtener VAPID public key |
| `POST` | `/api/v1/push/subscriptions` | **Sí** | Registrar suscripción push |

---

## Estructura del proyecto

```
src/
├── assets/main.css          → CSS variables + estilos globales
├── services/
│   ├── api.js               → Axios + interceptor JWT
│   ├── db.js                → IndexedDB (idb) para offline
│   ├── geoService.js        → navigator.geolocation
│   ├── imageService.js      → Base64 + compresión ≤50Kb (canvas)
│   ├── pushService.js       → VAPID subscription flow
│   └── syncService.js       → Sync offline → API (personas→mascotas→censos)
├── stores/
│   ├── authStore.js         → JWT session (Pinia)
│   └── syncStore.js         → Estado online/offline/pending
├── components/
│   ├── NavBar.vue           → Barra de navegación inferior
│   ├── SyncBanner.vue       → Banner de estado offline/pendiente
│   └── CameraCapture.vue    → Cámara + subida + compresión ≤50Kb
├── views/
│   ├── LoginView.vue        → Autenticación JWT
│   ├── DashboardView.vue    → Inicio con acciones rápidas
│   ├── PersonaFormView.vue  → Registro de personas/dueños
│   ├── MascotaFormView.vue  → Registro de mascotas
│   ├── CensoView.vue        → Censo: foto + GPS + dueño + mascota
│   └── MapView.vue          → Mapa Google Maps + pins + InfoWindow
├── router/index.js          → Vue Router 4 con navigation guard JWT
├── sw.js                    → Service Worker: cache + push + notificationclick
├── App.vue                  → Root component
└── main.js                  → Entry point
```

---

## Flujo offline (CP-01 y CP-02)

1. Sin conexión, cada formulario detecta `!navigator.onLine` y guarda en **IndexedDB** con estado `pending`.
2. El `SyncBanner` muestra el conteo de registros pendientes.
3. Al recuperar conexión, `syncService.syncPendingRecords()` envía en orden: **personas → mascotas → censos** (respeta dependencias FK).
4. Los registros sincronizados se eliminan de IndexedDB y el banner desaparece.

## Flujo push (RF10, RNF04, CP-05)

1. Tras login exitoso, `pushService.subscribeToPush()` solicita permiso de notificaciones.
2. Obtiene la VAPID public key del backend (`GET /api/v1/push/key`).
3. Suscribe al navegador con `pushManager.subscribe()` y envía el objeto al backend (`POST /api/v1/push/subscriptions`).
4. El Service Worker escucha el evento `push` en background y muestra la notificación del sistema.
5. Al hacer clic en la notificación, el listener `notificationclick` abre la app en `/mapa` (deeplink CP-05).
