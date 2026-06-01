<template>
  <div class="page fade-up">
    <button class="back-btn" @click="router.back()">← Volver</button>
    <p class="eyebrow">Mascotas</p>
    <h1>Nueva mascota</h1>
    <p class="page-sub">Registra los datos biográficos del animal.</p>

    <form @submit.prevent="handleSubmit" class="form-stack">
      <div class="card">
        <h3>Datos del animal</h3>
        <div class="divider"></div>

        <div class="field-row">
          <div class="field">
            <label>Nombre *</label>
            <input v-model="form.nombre" type="text" placeholder="Firulais" required maxlength="40" />
          </div>
          <div class="field">
            <label>Tipo / Especie *</label>
            <select v-model="form.tipo" required>
              <option value="PERRO">Perro</option>
              <option value="GATO">Gato</option>
              <option value="PAJARO">Pájaro</option>
              <option value="OTRO">Otro</option>
            </select>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <label>Género *</label>
            <select v-model="form.genero" required>
              <!-- Solo MACHO / HEMBRA — valores confirmados en Postman del ingeniero líder -->
              <!-- NO_DEFINIDO eliminado: no está en el contrato de la API y causa 400 -->
              <option value="MACHO">Macho</option>
              <option value="HEMBRA">Hembra</option>
            </select>
          </div>
          <div class="field">
            <label>Edad (años) *</label>
            <!-- min="0.5" evita que se envíe edad: 0 que el backend puede rechazar -->
            <input v-model.number="form.edad" type="number" placeholder="3.5" min="0.5" max="40" step="0.5" required />
          </div>
        </div>

        <div class="field">
          <label>URL foto de perfil <span class="optional">(opcional)</span></label>
          <input v-model="form.fotografia" type="url" placeholder="https://ejemplo.com/foto.jpg" />
        </div>
      </div>

      <p v-if="errorMsg"   class="helper-error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="helper-success">{{ successMsg }}</p>

      <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
        <div v-if="loading" class="spinner"></div>
        <span v-else>{{ isOffline ? 'Guardar localmente (offline)' : 'Registrar mascota' }}</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api.js'
import { savePending, countPending } from '@/services/db.js'
import { useSyncStore } from '@/stores/syncStore.js'

const router    = useRouter()
const syncStore = useSyncStore()
const isOffline = computed(() => !syncStore.isOnline)

const form = ref({ nombre: '', tipo: 'PERRO', genero: 'MACHO', edad: null, fotografia: '' })
const loading    = ref(false)
const errorMsg   = ref('')
const successMsg = ref('')

async function handleSubmit() {
  errorMsg.value = successMsg.value = ''

  // JS-side guard: edad must be a valid positive number
  // (HTML min="0.5" can be bypassed; this ensures the saved payload is always valid)
  const edadNum = parseFloat(form.value.edad)
  if (!edadNum || edadNum <= 0) {
    errorMsg.value = 'La edad debe ser mayor a 0.'
    return
  }

  loading.value = true

  // fotografia fallback matches Postman example from the lead engineer
  const fotografiaUrl = form.value.fotografia.trim() ||
    `https://via.placeholder.com/150?text=${encodeURIComponent(form.value.nombre)}`

  const payload = {
    nombre:     form.value.nombre.trim(),
    tipo:       form.value.tipo,
    genero:     form.value.genero,
    edad:       edadNum,
    fotografia: fotografiaUrl,
  }

  try {
    if (isOffline.value) {
      await savePending('mascota', payload)
      const count = await countPending()
      syncStore.setPending(count)
      successMsg.value = '✓ Guardado localmente. Se sincronizará cuando haya conexión.'
      resetForm()
    } else {
      await api.post('/api/v1/mascotas', payload)
      successMsg.value = '✓ Mascota registrada correctamente.'
      resetForm()
    }
  } catch (err) {
    // Show the API's validation message when available
    const apiMsg = err.response?.data?.message || err.response?.data?.error
    errorMsg.value = apiMsg || 'Error al registrar. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = { nombre: '', tipo: 'PERRO', genero: 'MACHO', edad: null, fotografia: '' }
}
</script>

<style scoped>
.back-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 0.9rem; padding: 0; margin-bottom: 12px; }
.page-sub { color: var(--muted); margin: 6px 0 20px; font-size: 0.9rem; }
.form-stack { display: flex; flex-direction: column; gap: 16px; }
.optional { font-size: 0.78rem; color: var(--muted); font-weight: 400; }
.helper-success { color: var(--success); font-size: 0.88rem; }
</style>