<template>
  <div class="page fade-up">
    <button class="back-btn" @click="router.back()">← Volver</button>
    <p class="eyebrow">Personas</p>
    <h1>Nueva persona</h1>
    <p class="page-sub">Registra un dueño de mascota o encuestador del sistema.</p>

    <form @submit.prevent="handleSubmit" class="form-stack">
      <div class="card">
        <h3>Datos personales</h3>
        <div class="divider"></div>
        <div class="field-row">
          <div class="field">
            <label>Nombres *</label>
            <input v-model="form.nombres" type="text" placeholder="Hugo Armando" required maxlength="60" />
          </div>
          <div class="field">
            <label>Apellidos *</label>
            <input v-model="form.apellidos" type="text" placeholder="Cristancho Chinome" required maxlength="60" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Tipo documento *</label>
            <select v-model="form.tipoDocumento" required>
              <option value="CC">Cédula de ciudadanía (CC)</option>
              <option value="CE">Cédula extranjería (CE)</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="TI">Tarjeta identidad (TI)</option>
            </select>
          </div>
          <div class="field">
            <label>Número de documento *</label>
            <input v-model="form.documento" type="text" placeholder="1000200300" required maxlength="20" />
          </div>
        </div>
        <div class="field">
          <label>Dirección *</label>
          <input v-model="form.direccion" type="text" placeholder="Calle Falsa 123, Barrio Centro" required maxlength="100" />
        </div>
        <div class="field-row">
          <div class="field">
            <label>Teléfono *</label>
            <input v-model="form.telefono" type="tel" placeholder="3001234567" required maxlength="15" />
          </div>
          <div class="field">
            <label>Ciudad *</label>
            <input v-model="form.ciudad" type="text" placeholder="Tunja" required maxlength="50" />
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Credenciales de acceso <span class="optional">(opcional para encuestadores)</span></h3>
        <div class="divider"></div>
        <div class="field-row">
          <div class="field">
            <label>Usuario</label>
            <input v-model="form.usuario" type="text" placeholder="hcristancho" maxlength="30" autocomplete="username" />
          </div>
          <div class="field">
            <label>Contraseña</label>
            <input v-model="form.contrasena" type="password" placeholder="••••••••" minlength="8" autocomplete="new-password" />
          </div>
        </div>
        <p class="hint-text">Si ingresas credenciales, la contraseña será encriptada antes de enviarse.</p>
      </div>

      <p v-if="errorMsg"  class="helper-error">{{ errorMsg }}</p>
      <p v-if="successMsg" class="helper-success">{{ successMsg }}</p>

      <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
        <div v-if="loading" class="spinner"></div>
        <span v-else>{{ isOffline ? 'Guardar localmente (offline)' : 'Registrar persona' }}</span>
      </button>
    </form>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import bcrypt from 'bcryptjs'
import api from '@/services/api.js'
import { savePending, countPending } from '@/services/db.js'
import { useSyncStore } from '@/stores/syncStore.js'

const router    = useRouter()
const syncStore = useSyncStore()
const isOffline = computed(() => !syncStore.isOnline)

const form = ref({
  nombres: '', apellidos: '', tipoDocumento: 'CC', documento: '',
  direccion: '', telefono: '', ciudad: '', usuario: '', contrasena: '',
})
const loading    = ref(false)
const errorMsg   = ref('')
const successMsg = ref('')

async function handleSubmit() {
  errorMsg.value = successMsg.value = ''
  loading.value = true

  const hasCredentials = form.value.usuario && form.value.contrasena
  const endpoint = hasCredentials ? '/api/v1/personas/registro' : '/api/v1/personas'

  // Build payload
  const payload = {
    nombres:       form.value.nombres,
    apellidos:     form.value.apellidos,
    tipoDocumento: form.value.tipoDocumento,
    documento:     form.value.documento,
    direccion:     form.value.direccion,
    telefono:      form.value.telefono,
    ciudad:        form.value.ciudad,
  }
  if (hasCredentials) {
    // RF01: hash password before sending (bcryptjs)
    const hash = await bcrypt.hash(form.value.contrasena, 10)
    payload.usuario    = form.value.usuario
    payload.contrasena = hash
  }

  try {
    if (isOffline.value) {
      await savePending('persona', { ...payload, _endpoint: endpoint })
      const count = await countPending()
      syncStore.setPending(count)
      successMsg.value = '✓ Guardado localmente. Se sincronizará cuando haya conexión.'
      resetForm()
    } else {
      await api.post(endpoint, payload)
      successMsg.value = '✓ Persona registrada correctamente.'
      resetForm()
    }
  } catch (err) {
    errorMsg.value = err.response?.data?.message || 'Error al registrar. Intenta nuevamente.'
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.value = { nombres: '', apellidos: '', tipoDocumento: 'CC', documento: '', direccion: '', telefono: '', ciudad: '', usuario: '', contrasena: '' }
}
</script>

<style scoped>
.back-btn { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 0.9rem; padding: 0; margin-bottom: 12px; }
.page-sub { color: var(--muted); margin: 6px 0 20px; font-size: 0.9rem; }
.form-stack { display: flex; flex-direction: column; gap: 16px; }
.optional { font-size: 0.78rem; color: var(--muted); font-weight: 400; }
.hint-text { font-size: 0.8rem; color: var(--muted); margin-top: 8px; }
.helper-success { color: var(--success); font-size: 0.88rem; }
</style>
