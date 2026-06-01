<template>
  <div class="login-page">
    <div class="login-card fade-up">
      <!-- Logo -->
      <div class="logo-wrap">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <rect width="64" height="64" rx="18" fill="#FFDD00"/>
          <path d="M20 37c4-7 10-10 12-10s8 3 12 10c2 3 1 8-2 11s-7 3-10 1c-3 2-7 2-10-1s-4-8-2-11z" fill="#141414"/>
          <circle cx="22" cy="24" r="4" fill="#141414"/>
          <circle cx="32" cy="19" r="4" fill="#141414"/>
          <circle cx="42" cy="24" r="4" fill="#141414"/>
        </svg>
        <div>
          <h1>CensoPet</h1>
          <p class="eyebrow">Sistema de censo de mascotas · UPTC</p>
        </div>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="field">
          <label for="usuario">Usuario</label>
          <input
            id="usuario"
            v-model="form.usuario"
            type="text"
            placeholder="hcristancho"
            autocomplete="username"
            required
          />
        </div>

        <div class="field">
          <label for="contrasena">Contraseña</label>
          <div class="pw-wrap">
            <input
              id="contrasena"
              v-model="form.contrasena"
              :type="showPw ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              required
            />
            <button type="button" class="pw-toggle" @click="showPw = !showPw">
              {{ showPw ? '🙈' : '👁' }}
            </button>
          </div>
        </div>

        <p v-if="errorMsg" class="helper-error">{{ errorMsg }}</p>

        <button type="submit" class="btn btn-primary btn-full" :disabled="loading">
          <div v-if="loading" class="spinner"></div>
          <span v-else>Iniciar sesión</span>
        </button>
      </form>

      <!-- Offline notice -->
      <div v-if="!isOnline" class="offline-notice">
        <span class="dot dot-red"></span>
        Sin conexión · modo offline disponible tras primer login
      </div>

      <!-- Register link -->
      <p class="register-hint">
        ¿Sin cuenta?
        <RouterLink to="/personas/nuevo" class="link">Registrarse como encuestador</RouterLink>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'
import { useSyncStore } from '@/stores/syncStore.js'
import { subscribeToPush } from '@/services/pushService.js'
import api from '@/services/api.js'

const router    = useRouter()
const authStore = useAuthStore()
const syncStore = useSyncStore()

const form    = ref({ usuario: '', contrasena: '' })
const loading = ref(false)
const showPw  = ref(false)
const errorMsg = ref('')
const isOnline = syncStore.isOnline

async function handleLogin() {
  errorMsg.value = ''
  loading.value  = true
  try {
    // POST /api/v1/auth/login — password sent as-is (backend handles hashing)
    const { data } = await api.post('/api/v1/auth/login', {
      usuario:   form.value.usuario,
      contrasena: form.value.contrasena,
    })

    authStore.setSession(data.token, { usuario: form.value.usuario })

    // Subscribe to push notifications after successful login (RF10, RNF04)
    subscribeToPush().catch((e) => console.warn('[push]', e.message))

    router.push({ name: 'dashboard' })
  } catch (err) {
    errorMsg.value =
      err.response?.status === 401
        ? 'Usuario o contraseña incorrectos.'
        : 'Error de conexión. Verifica que el servidor esté disponible.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: radial-gradient(ellipse at top, rgba(255,221,0,0.08) 0%, transparent 60%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 28px;
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.logo-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
}
.logo-wrap h1 { font-size: 1.6rem; }
.logo-wrap .eyebrow { margin: 4px 0 0; }

.login-form { display: flex; flex-direction: column; gap: 16px; }

.pw-wrap { position: relative; }
.pw-wrap input { padding-right: 44px; }
.pw-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
}

.offline-notice {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(248,113,113,0.1);
  border: 1px solid rgba(248,113,113,0.2);
  border-radius: var(--radius-md);
  padding: 10px 14px;
  font-size: 0.84rem;
  color: var(--error);
}

.register-hint { text-align: center; font-size: 0.88rem; color: var(--muted); }
.link { color: var(--yellow); text-decoration: none; font-weight: 600; }
</style>
