<template>
  <Transition name="banner">
    <div v-if="show" class="sync-banner" :class="bannerClass">
      <div class="banner-content">
        <span class="dot" :class="dotClass"></span>
        <span class="banner-text">{{ message }}</span>
        <div v-if="syncStore.isSyncing" class="spinner"></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'
import { useSyncStore } from '@/stores/syncStore.js'

const syncStore = useSyncStore()

const show = computed(() => !syncStore.isOnline || syncStore.pendingCount > 0 || syncStore.isSyncing)

const bannerClass = computed(() => ({
  'banner-offline': !syncStore.isOnline,
  'banner-pending': syncStore.isOnline && syncStore.pendingCount > 0,
  'banner-syncing': syncStore.isSyncing,
}))

const dotClass = computed(() => ({
  'dot-red':    !syncStore.isOnline,
  'dot-yellow': syncStore.isOnline && !syncStore.isSyncing,
  'dot-green':  syncStore.isSyncing,
}))

const message = computed(() => {
  if (syncStore.isSyncing) return 'Sincronizando registros...'
  if (!syncStore.isOnline)  return 'Sin conexión · datos guardados localmente'
  if (syncStore.pendingCount > 0)
    return `${syncStore.pendingCount} registro${syncStore.pendingCount > 1 ? 's' : ''} pendiente${syncStore.pendingCount > 1 ? 's' : ''} de sincronización`
  return ''
})
</script>

<style scoped>
.sync-banner {
  position: sticky;
  top: 0;
  z-index: 90;
  padding: 10px 16px;
  font-size: 0.83rem;
  font-weight: 600;
}
.banner-offline { background: rgba(248,113,113,0.12); border-bottom: 1px solid rgba(248,113,113,0.2); }
.banner-pending { background: var(--yellow-dim); border-bottom: 1px solid rgba(255,221,0,0.2); }
.banner-syncing { background: rgba(74,222,128,0.1); border-bottom: 1px solid rgba(74,222,128,0.2); }

.banner-content { display: flex; align-items: center; gap: 8px; max-width: 560px; margin: 0 auto; }
.banner-text { flex: 1; }

.banner-enter-active, .banner-leave-active { transition: all 0.3s ease; }
.banner-enter-from, .banner-leave-to { opacity: 0; transform: translateY(-100%); }
</style>
