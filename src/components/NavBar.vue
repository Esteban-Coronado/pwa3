<template>
  <nav class="navbar">
    <RouterLink to="/" class="nav-item" :class="{ active: route.path === '/' }">
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1z"/><path d="M9 21V12h6v9"/>
      </svg>
      <span>Inicio</span>
    </RouterLink>

    <RouterLink to="/censo/nuevo" class="nav-item census-btn">
      <div class="census-circle">
        <svg width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
          <rect x="9" y="3" width="6" height="4" rx="1"/>
          <path d="M9 12h6M9 16h4"/>
        </svg>
      </div>
      <span>Censo</span>
    </RouterLink>

    <RouterLink to="/mapa" class="nav-item" :class="{ active: route.path === '/mapa' }">
      <svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3z"/><path d="M9 4v13M15 7v13"/>
      </svg>
      <span>Mapa</span>
    </RouterLink>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'
const route = useRoute()
</script>

<style scoped>
.navbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: rgba(18, 18, 18, 0.96);
  border-top: 1px solid var(--border);
  backdrop-filter: blur(12px);
  padding: 10px 8px max(18px, env(safe-area-inset-bottom));
  z-index: 100;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: var(--muted);
  text-decoration: none;
  font-size: 0.72rem;
  font-weight: 600;
  min-width: 60px;
  transition: color 0.15s;
}
.nav-item.active,
.nav-item.router-link-active { color: var(--yellow); }

.census-btn { color: var(--ink); }
.census-circle {
  width: 52px;
  height: 52px;
  background: var(--yellow);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -20px;
  box-shadow: 0 4px 20px rgba(255,221,0,0.45);
}
.census-btn span { color: var(--yellow); }
</style>
