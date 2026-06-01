<template>
  <div class="page fade-up">
    <button class="back-btn" @click="router.back()">← Volver</button>
    <p class="eyebrow">Censo</p>
    <h1>Nuevo censo</h1>

    <!-- Project badge -->
    <div class="project-badge">
      <div class="color-dot" :style="{ background: proyectoColor }"></div>
      <span>{{ proyectoId }}</span>
      <span class="auto-label">· inyectado automáticamente</span>
    </div>

    <form @submit.prevent="handleSubmit" class="form-stack">
      <!-- Dueño selector -->
      <div class="card">
        <h3>Dueño de la mascota</h3>
        <div class="divider"></div>
        <div class="field">
          <label>Buscar por nombre o documento</label>
          <input v-model="personaSearch" type="text" placeholder="Cristancho, 1000200300..." @input="fetchPersonas" />
        </div>
        <div v-if="personas.length" class="entity-list">
          <button
            v-for="p in personas" :key="p.id" type="button"
            class="entity-item" :class="{ selected: selectedPersona?.id === p.id }"
            @click="selectedPersona = p"
          >
            <div class="entity-avatar">{{ initials(p.nombres) }}</div>
            <div>
              <strong>{{ p.nombres }} {{ p.apellidos }}</strong>
              <span>{{ p.tipoDocumento }} · {{ p.documento }}</span>
            </div>
            <span v-if="selectedPersona?.id === p.id" class="check">✓</span>
          </button>
        </div>
        <p v-if="personaSearch && !personas.length" class="hint-text">Sin resultados. <RouterLink to="/personas/nuevo">Crear persona</RouterLink></p>
      </div>

      <!-- Mascota selector -->
      <div class="card">
        <h3>Mascota</h3>
        <div class="divider"></div>
        <div class="field">
          <label>Buscar por nombre o tipo</label>
          <input v-model="mascotaSearch" type="text" placeholder="Firulais, PERRO..." @input="fetchMascotas" />
        </div>
        <div v-if="mascotas.length" class="entity-list">
          <button
            v-for="m in mascotas" :key="m.id" type="button"
            class="entity-item" :class="{ selected: selectedMascota?.id === m.id }"
            @click="selectedMascota = m"
          >
            <div class="entity-avatar pet">🐾</div>
            <div>
              <strong>{{ m.nombre }}</strong>
              <span>{{ m.tipo }} · {{ m.genero }} · {{ m.edad }} años</span>
            </div>
            <span v-if="selectedMascota?.id === m.id" class="check">✓</span>
          </button>
        </div>
        <p v-if="mascotaSearch && !mascotas.length" class="hint-text">Sin resultados. <RouterLink to="/mascotas/nuevo">Crear mascota</RouterLink></p>
      </div>

      <!-- Photo capture (RF04) -->
      <div class="card">
        <h3>Fotografía del censo</h3>
        <p class="hint-text">Máximo 50 Kb · formato Base64 · compresión automática</p>
        <div class="divider"></div>
        <CameraCapture v-model="photo" />
      </div>

      <!-- Geolocation (RF05) -->
      <div class="card">
        <h3>Geolocalización</h3>
        <div class="divider"></div>
        <div class="geo-row">
          <input :value="location ? location.lat.toFixed(6) : ''" type="text" placeholder="Latitud" readonly />
          <input :value="location ? location.lon.toFixed(6) : ''" type="text" placeholder="Longitud" readonly />
        </div>
        <button type="button" class="btn btn-ghost btn-full" style="margin-top:10px" @click="getLocation" :disabled="geoLoading">
          <div v-if="geoLoading" class="spinner"></div>
          <span v-else>{{ location ? '🔄 Actualizar ubicación' : '📍 Obtener ubicación GPS' }}</span>
        </button>
        <p v-if="geoError" class="helper-error">{{ geoError }}</p>
        <div v-if="location" class="geo-ok">
          <span class="dot dot-green"></span>
          GPS capturado · {{ location.lat.toFixed(4) }}, {{ location.lon.toFixed(4) }}
        </div>
      </div>

      <!-- Validation summary -->
      <div class="validation-summary">
        <div class="val-item" :class="selectedPersona ? 'ok' : 'pending'">
          {{ selectedPersona ? '✓' : '○' }} Dueño seleccionado
        </div>
        <div class="val-item" :class="selectedMascota ? 'ok' : 'pending'">
          {{ selectedMascota ? '✓' : '○' }} Mascota seleccionada
        </div>
        <div class="val-item" :class="photo ? 'ok' : 'pending'">
          {{ photo ? '✓' : '○' }} Fotografía capturada
        </div>
        <div class="val-item" :class="location ? 'ok' : 'pending'">
          {{ location ? '✓' : '○' }} Ubicación GPS obtenida
        </div>
      </div>

      <p v-if="errorMsg"   class="helper-error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="helper-success">{{ successMsg }}</p>

      <button
        type="submit"
        class="btn btn-primary btn-full"
        :disabled="loading || !canSubmit"
      >
        <div v-if="loading" class="spinner"></div>
        <span v-else>{{ isOffline ? 'Guardar localmente (offline)' : 'Guardar censo' }}</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import CameraCapture from '@/components/CameraCapture.vue'
import api from '@/services/api.js'
import { getCurrentPosition } from '@/services/geoService.js'
import { savePending, countPending } from '@/services/db.js'
import { useSyncStore } from '@/stores/syncStore.js'

const router    = useRouter()
const syncStore = useSyncStore()
const isOffline = computed(() => !syncStore.isOnline)

// Project config (RF06 — injected automatically from env)
const proyectoId    = import.meta.env.VITE_PROYECTO_ID    || 'PWA_GRUPO_01'
const proyectoColor = import.meta.env.VITE_PROYECTO_COLOR || '#FFDD00'

// Form state
const personas       = ref([])
const mascotas       = ref([])
const personaSearch  = ref('')
const mascotaSearch  = ref('')
const selectedPersona = ref(null)
const selectedMascota = ref(null)
const photo          = ref('')
const location       = ref(null)
const geoLoading     = ref(false)
const geoError       = ref('')
const loading        = ref(false)
const errorMsg       = ref('')
const successMsg     = ref('')

const canSubmit = computed(() =>
  selectedPersona.value && selectedMascota.value && photo.value && location.value
)

// Search personas with debounce
let personaTimer = null
function fetchPersonas() {
  clearTimeout(personaTimer)
  if (!personaSearch.value.trim()) { personas.value = []; return }
  personaTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/api/v1/personas')
      const q = personaSearch.value.toLowerCase()
      personas.value = data.filter((p) =>
        `${p.nombres} ${p.apellidos} ${p.documento}`.toLowerCase().includes(q)
      ).slice(0, 5)
    } catch { personas.value = [] }
  }, 350)
}

let mascotaTimer = null
function fetchMascotas() {
  clearTimeout(mascotaTimer)
  if (!mascotaSearch.value.trim()) { mascotas.value = []; return }
  mascotaTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/api/v1/mascotas')
      const q = mascotaSearch.value.toLowerCase()
      mascotas.value = data.filter((m) =>
        `${m.nombre} ${m.tipo}`.toLowerCase().includes(q)
      ).slice(0, 5)
    } catch { mascotas.value = [] }
  }, 350)
}

async function getLocation() {
  geoError.value = ''
  geoLoading.value = true
  try {
    location.value = await getCurrentPosition()
  } catch (e) {
    geoError.value = e.message
  } finally {
    geoLoading.value = false
  }
}

async function handleSubmit() {
  errorMsg.value = successMsg.value = ''
  loading.value = true

  const payload = {
    idMascota:  selectedMascota.value.id,
    idDueno:    selectedPersona.value.id,
    fotografia: photo.value,
    lat:        location.value.lat,
    lon:        location.value.lon,
    idProyecto: proyectoId,    // RF06
    color:      proyectoColor, // RF06
  }

  try {
    if (isOffline.value) {
      await savePending('censo', payload)
      const count = await countPending()
      syncStore.setPending(count)
      successMsg.value = '✓ Censo guardado localmente. Se sincronizará al recuperar conexión.'
      resetForm()
    } else {
      await api.post('/api/v1/censos', payload)
      successMsg.value = '✓ Censo registrado exitosamente.'
      resetForm()
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Error al guardar el censo.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  selectedPersona.value = selectedMascota.value = null
  personaSearch.value = mascotaSearch.value = ''
  personas.value = mascotas.value = []
  photo.value = ''
  location.value = null
}

function initials(name) {
  return name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '??'
}
</script>

<style scoped>
.back-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 0.9rem; padding: 0; margin-bottom: 12px; }
.form-stack { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }

.project-badge {
  display: inline-flex; align-items: center; gap: 8px;
  background: var(--yellow-dim); border: 1px solid rgba(255,221,0,0.25);
  border-radius: 999px; padding: 6px 14px; margin-bottom: 4px;
  font-size: 0.82rem; font-weight: 700; color: var(--yellow);
}
.color-dot { width: 10px; height: 10px; border-radius: 50%; }
.auto-label { font-weight: 400; color: var(--muted); }

.entity-list { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
.entity-item {
  display: flex; align-items: center; gap: 12px;
  background: var(--surface2); border: 1.5px solid var(--border);
  border-radius: var(--radius-md); padding: 12px;
  cursor: pointer; text-align: left; width: 100%;
  transition: border-color 0.15s;
}
.entity-item:hover  { border-color: rgba(255,221,0,0.4); }
.entity-item.selected { border-color: var(--yellow); background: var(--yellow-dim); }
.entity-item > div:nth-child(2) { flex: 1; }
.entity-item > div:nth-child(2) strong { display: block; font-size: 0.9rem; color: var(--text); }
.entity-item > div:nth-child(2) span   { font-size: 0.78rem; color: var(--muted); }

.entity-avatar {
  width: 38px; height: 38px; border-radius: 10px;
  background: var(--yellow); color: var(--ink);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.82rem; font-weight: 700; flex-shrink: 0;
}
.entity-avatar.pet { background: rgba(96,165,250,0.15); font-size: 1.2rem; }
.check { color: var(--yellow); font-weight: 700; }

.geo-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.geo-ok { display: flex; align-items: center; gap: 7px; font-size: 0.82rem; color: var(--success); margin-top: 10px; }

.validation-summary { display: flex; flex-direction: column; gap: 6px; }
.val-item { font-size: 0.85rem; padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); }
.val-item.ok      { border-color: rgba(74,222,128,0.3); color: var(--success); }
.val-item.pending { color: var(--muted); }

.hint-text { font-size: 0.8rem; color: var(--muted); margin-top: 6px; }
.hint-text a { color: var(--yellow); }
.helper-success { color: var(--success); font-size: 0.88rem; }
</style>
