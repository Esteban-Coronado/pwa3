<template>
  <div class="page fade-up">
    <!-- Header -->
    <div class="dash-header">
      <div>
        <p class="eyebrow">Dashboard</p>
        <h1>Buenos días 👋</h1>
        <p class="sub">{{ authStore.user?.usuario }}</p>
      </div>
      <div class="header-right">
        <span class="badge" :class="syncStore.isOnline ? 'badge-online' : 'badge-offline'">
          <span class="dot" :class="syncStore.isOnline ? 'dot-yellow' : 'dot-red'"></span>
          {{ syncStore.isOnline ? 'En línea' : 'Offline' }}
        </span>
        <button class="btn btn-ghost btn-sm logout-btn" @click="logout">Salir</button>
      </div>
    </div>

    <!-- Pending alert -->
    <div v-if="syncStore.pendingCount > 0" class="pending-alert">
      <span>🔄</span>
      <span>{{ syncStore.pendingCount }} registro{{ syncStore.pendingCount > 1 ? 's' : '' }} pendiente{{ syncStore.pendingCount > 1 ? 's' : '' }} de sincronización</span>
    </div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Proyecto</span>
        <strong class="stat-value yellow">{{ proyectoId }}</strong>
      </div>
      <div class="stat-card">
        <span class="stat-label">Color asignado</span>
        <div class="color-chip">
          <div class="color-dot" :style="{ background: proyectoColor }"></div>
          <strong>{{ proyectoColor }}</strong>
        </div>
      </div>
    </div>

    <!-- Quick actions -->
    <p class="section-title">Acciones rápidas</p>
    <div class="actions-list">
      <RouterLink to="/personas/nuevo" class="action-card">
        <div class="action-icon green">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
        </div>
        <div>
          <strong>Nueva persona</strong>
          <p>Registrar dueño o encuestador</p>
        </div>
        <span class="chevron">›</span>
      </RouterLink>

      <RouterLink to="/mascotas/nuevo" class="action-card">
        <div class="action-icon blue">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.828M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.96-1.45-2.344-2.828M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17z"/>
            <path d="M8.5 21a8 8 0 007 0c.5-.225.5-2.5 0-3s-2.5-1-3.5-1-3 .5-3.5 1-.5 2.775 0 3z"/>
          </svg>
        </div>
        <div>
          <strong>Nueva mascota</strong>
          <p>Registrar animal para censo</p>
        </div>
        <span class="chevron">›</span>
      </RouterLink>

      <RouterLink to="/censo/nuevo" class="action-card action-card-primary">
        <div class="action-icon dark">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
            <rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h4"/>
          </svg>
        </div>
        <div>
          <strong>Nuevo censo</strong>
          <p>Foto + GPS + mascota y dueño</p>
        </div>
        <span class="chevron">›</span>
      </RouterLink>

      <RouterLink to="/mapa" class="action-card">
        <div class="action-icon purple">
          <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/>
          </svg>
        </div>
        <div>
          <strong>Ver mapa</strong>
          <p>Todos los censos geolocalizados</p>
        </div>
        <span class="chevron">›</span>
      </RouterLink>
    </div>
  </div>
</template>

<script setup>
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'
import { useSyncStore } from '@/stores/syncStore.js'

const authStore    = useAuthStore()
const syncStore    = useSyncStore()
const router       = useRouter()
const proyectoId   = import.meta.env.VITE_PROYECTO_ID    || 'PWA_GRUPO_01'
const proyectoColor = import.meta.env.VITE_PROYECTO_COLOR || '#FFDD00'

function logout() {
  authStore.clearSession()
  router.push({ name: 'login' })
}
</script>

<style scoped>
.dash-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.sub { color: var(--muted); font-size: 0.9rem; margin-top: 4px; }
.header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.logout-btn { font-size: 0.78rem; padding: 7px 14px; }

.pending-alert {
  display: flex; align-items: center; gap: 8px;
  background: var(--yellow-dim); border: 1px solid rgba(255,221,0,0.25);
  border-radius: var(--radius-md); padding: 12px 14px;
  font-size: 0.88rem; font-weight: 600; color: var(--yellow);
  margin-bottom: 16px;
}

.stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px; }
.stat-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; }
.stat-label { display: block; font-size: 0.78rem; color: var(--muted); font-weight: 600; margin-bottom: 6px; }
.stat-value { font-size: 1rem; font-weight: 700; }
.stat-value.yellow { color: var(--yellow); }
.color-chip { display: flex; align-items: center; gap: 8px; }
.color-dot { width: 22px; height: 22px; border-radius: 6px; flex-shrink: 0; }

.section-title { font-size: 0.78rem; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: var(--muted); margin-bottom: 12px; }

.actions-list { display: flex; flex-direction: column; gap: 10px; }
.action-card {
  display: flex; align-items: center; gap: 14px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 16px;
  text-decoration: none; color: var(--text);
  transition: border-color 0.15s, background 0.15s;
}
.action-card:hover { border-color: rgba(255,221,0,0.3); }
.action-card-primary { background: var(--yellow); color: var(--ink); border-color: var(--yellow); }
.action-card-primary:hover { opacity: 0.9; }
.action-card > div:nth-child(2) { flex: 1; }
.action-card > div:nth-child(2) strong { display: block; font-size: 0.95rem; }
.action-card > div:nth-child(2) p { font-size: 0.82rem; color: var(--muted); margin-top: 2px; }
.action-card-primary > div:nth-child(2) p { color: rgba(0,0,0,0.5); }

.action-icon {
  width: 40px; height: 40px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.action-icon.green  { background: rgba(74,222,128,0.12); color: var(--success); }
.action-icon.blue   { background: rgba(96,165,250,0.12); color: var(--blue); }
.action-icon.purple { background: rgba(167,139,250,0.12); color: #a78bfa; }
.action-icon.dark   { background: rgba(0,0,0,0.25); color: var(--ink); }

.chevron { font-size: 1.4rem; color: var(--muted); }
.action-card-primary .chevron { color: rgba(0,0,0,0.4); }
</style>
