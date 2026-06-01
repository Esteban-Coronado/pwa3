<template>
  <div class="map-page">
    <!-- Header -->
    <div class="map-header">
      <div class="map-header-content">
        <div>
          <p class="eyebrow">Mapa censal</p>
          <h2>{{ censos.length }} censo{{ censos.length !== 1 ? 's' : '' }} registrados</h2>
        </div>
        <button class="btn btn-ghost btn-sm" @click="loadCensos" :disabled="loading">
          <div v-if="loading" class="spinner"></div>
          <span v-else>↺ Actualizar</span>
        </button>
      </div>
    </div>

    <!-- Map container -->
    <div ref="mapEl" class="map-container"></div>

    <!-- InfoWindow card (shown when a pin is clicked) -->
    <Transition name="slide-up">
      <div v-if="selectedCenso" class="info-card">
        <div class="info-card-inner">
          <button class="info-close" @click="selectedCenso = null">✕</button>

          <!-- Foto Base64 -->
          <div class="info-photo-wrap">
            <img
              v-if="selectedCenso.fotografiaCenso"
              :src="selectedCenso.fotografiaCenso"
              alt="Fotografía del censo"
              class="info-photo"
            />
            <div v-else class="info-photo-placeholder">Sin fotografía</div>
          </div>

          <!-- Project chip -->
          <div class="info-project">
            <div class="info-dot" :style="{ background: selectedCenso.color }"></div>
            <span>{{ selectedCenso.idProyecto }}</span>
          </div>

          <div class="info-divider"></div>

          <!-- Mascota data (RF09) -->
          <div class="info-section">
            <p class="info-label">Mascota</p>
            <p class="info-name">{{ selectedCenso.mascota?.nombre }}</p>
            <div class="info-tags">
              <span class="tag">{{ selectedCenso.mascota?.tipo }}</span>
              <span class="tag">{{ selectedCenso.mascota?.edad }} años</span>
            </div>
          </div>

          <div class="info-divider"></div>

          <!-- Dueño data (RF09) -->
          <div class="info-section">
            <p class="info-label">Dueño</p>
            <p class="info-name">{{ selectedCenso.dueno?.nombres }} {{ selectedCenso.dueno?.apellidos }}</p>
            <p class="info-sub">📞 {{ selectedCenso.dueno?.telefono }}</p>
          </div>

          <div class="info-divider"></div>

          <!-- Coordinates -->
          <div class="info-section">
            <p class="info-label">Ubicación</p>
            <p class="info-sub mono">{{ selectedCenso.lat?.toFixed(6) }}, {{ selectedCenso.lon?.toFixed(6) }}</p>
          </div>
        </div>
      </div>
    </Transition>

    <p v-if="error" class="map-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { Loader } from '@googlemaps/js-api-loader'
import api from '@/services/api.js'

const route        = useRoute()
const mapEl        = ref(null)
const censos       = ref([])
const selectedCenso = ref(null)
const loading      = ref(false)
const error        = ref('')

let mapInstance    = null
let markersMap     = {}

// ── Load censos from API ──────────────────────────────────────────
async function loadCensos() {
  loading.value = true
  error.value   = ''
  try {
    // Use requestIdleCallback to not block main thread (RNF03)
    await new Promise((resolve) => {
      const fn = async () => {
        const { data } = await api.get('/api/v1/censos')
        censos.value = data
        resolve()
      }
      if ('requestIdleCallback' in window) {
        requestIdleCallback(fn)
      } else {
        fn()
      }
    })
    if (mapInstance) renderMarkers()
  } catch (err) {
    error.value = 'No se pudieron cargar los censos. Verifica la conexión.'
  } finally {
    loading.value = false
  }
}

// ── Render colored map markers (RF08) ────────────────────────────
function renderMarkers() {
  // Clear existing markers
  Object.values(markersMap).forEach((m) => m.setMap(null))
  markersMap = {}

  censos.value.forEach((censo) => {
    if (!censo.lat || !censo.lon) return

    const color   = censo.color || '#FFDD00'
    const darkColor = shadeColor(color, -30)

    // Custom SVG pin with the census color
    const svgPin = `
      <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 43S2 27.5 2 18a16 16 0 1 1 32 0C34 27.5 18 43 18 43z"
          fill="${color}" stroke="${darkColor}" stroke-width="1.5"/>
        <circle cx="18" cy="18" r="7" fill="white" opacity="0.9"/>
        <circle cx="18" cy="18" r="4" fill="${darkColor}"/>
      </svg>
    `

    const marker = new google.maps.Marker({
      position: { lat: Number(censo.lat), lng: Number(censo.lon) },
      map: mapInstance,
      icon: {
        url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgPin)}`,
        scaledSize: new google.maps.Size(36, 44),
        anchor: new google.maps.Point(18, 44),
      },
      title: censo.mascota?.nombre || 'Censo',
    })

    marker.addListener('click', () => {
      selectedCenso.value = censo
      mapInstance.panTo({ lat: Number(censo.lat), lng: Number(censo.lon) })
    })

    markersMap[censo.id] = marker
  })
}

// Helper: darken a hex color
function shadeColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16)
  const r   = Math.min(255, Math.max(0, (num >> 16) + percent))
  const g   = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + percent))
  const b   = Math.min(255, Math.max(0, (num & 0x0000ff) + percent))
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ── Init Google Maps ──────────────────────────────────────────────
onMounted(async () => {
  // Load censos first
  await loadCensos()

  const loader = new Loader({
    apiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY || '',
    version: 'weekly',
    libraries: ['maps', 'marker'],
  })

  try {
    await loader.load()

    // Default center: Tunja, Colombia
    const center = censos.value.length
      ? { lat: Number(censos.value[0].lat), lng: Number(censos.value[0].lon) }
      : { lat: 5.535, lng: -73.361 }

    mapInstance = new google.maps.Map(mapEl.value, {
      center,
      zoom: 13,
      mapTypeId: 'roadmap',
      disableDefaultUI: false,
      zoomControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      styles: darkMapStyle,
    })

    renderMarkers()

    // If coming from push notification deeplink (?idCenso=...), auto-open InfoWindow
    const idCenso = route.query.idCenso
    if (idCenso) {
      const target = censos.value.find((c) => c.id === idCenso)
      if (target) {
        selectedCenso.value = target
        mapInstance.panTo({ lat: Number(target.lat), lng: Number(target.lon) })
        mapInstance.setZoom(16)
      }
    }
  } catch (e) {
    error.value = 'No se pudo cargar Google Maps. Verifica la API key en .env'
  }
})

onUnmounted(() => {
  Object.values(markersMap).forEach((m) => m.setMap(null))
})

// ── Dark map style ────────────────────────────────────────────────
const darkMapStyle = [
  { elementType: 'geometry',       stylers: [{ color: '#1d2c4d' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#255763' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#283d6a' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#2f3948' }] },
]
</script>

<style scoped>
.map-page {
  display: flex;
  flex-direction: column;
  height: 100dvh;
  padding-bottom: 72px; /* NavBar height */
}

.map-header {
  background: rgba(18,18,18,0.95);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(10px);
  padding: 14px 16px;
  flex-shrink: 0;
}
.map-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 560px;
  margin: 0 auto;
}
.map-header h2 { font-size: 1rem; }

.map-container {
  flex: 1;
  width: 100%;
  min-height: 0;
}

/* InfoWindow card slide-up from bottom */
.info-card {
  position: absolute;
  bottom: 72px;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 0 12px 12px;
  pointer-events: none;
}
.info-card-inner {
  background: var(--surface);
  border: 1px solid rgba(255,221,0,0.25);
  border-radius: 22px;
  padding: 16px;
  max-width: 500px;
  margin: 0 auto;
  pointer-events: all;
  position: relative;
  max-height: 60dvh;
  overflow-y: auto;
}

.info-close {
  position: absolute;
  top: 12px; right: 14px;
  background: var(--surface2);
  border: none; border-radius: 50%;
  width: 28px; height: 28px;
  cursor: pointer; color: var(--muted);
  font-size: 0.85rem;
  display: flex; align-items: center; justify-content: center;
}

.info-photo-wrap {
  width: 100%;
  height: 140px;
  border-radius: var(--radius-lg);
  overflow: hidden;
  margin-bottom: 12px;
  background: var(--surface2);
}
.info-photo { width: 100%; height: 100%; object-fit: cover; display: block; }
.info-photo-placeholder { height: 100%; display: flex; align-items: center; justify-content: center; color: var(--muted); font-size: 0.85rem; }

.info-project { display: flex; align-items: center; gap: 7px; margin-bottom: 10px; }
.info-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.info-project span { font-size: 0.8rem; font-weight: 700; color: var(--yellow); }

.info-divider { height: 1px; background: var(--border); margin: 10px 0; }

.info-section { margin-bottom: 2px; }
.info-label { font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 4px; }
.info-name { font-size: 1rem; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.info-sub  { font-size: 0.85rem; color: var(--muted); }
.info-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
.tag { background: var(--surface2); border: 1px solid var(--border); border-radius: 999px; padding: 3px 10px; font-size: 0.78rem; font-weight: 600; color: var(--text); }

.mono { font-family: 'Courier New', monospace; font-size: 0.82rem; }

.map-error {
  position: absolute;
  bottom: 90px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(248,113,113,0.15);
  border: 1px solid rgba(248,113,113,0.3);
  border-radius: var(--radius-md);
  padding: 10px 18px;
  color: var(--error);
  font-size: 0.85rem;
  text-align: center;
  max-width: 340px;
  width: calc(100% - 32px);
}

/* Slide-up transition */
.slide-up-enter-active, .slide-up-leave-active { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
.slide-up-enter-from, .slide-up-leave-to { opacity: 0; transform: translateY(40px); }
</style>
