<template>
  <SyncBanner />
  <RouterView />
  <NavBar v-if="authStore.isAuthenticated" />
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import NavBar from '@/components/NavBar.vue'
import SyncBanner from '@/components/SyncBanner.vue'
import { useAuthStore } from '@/stores/authStore.js'
import { useSyncStore } from '@/stores/syncStore.js'
import { syncPendingRecords } from '@/services/syncService.js'

const authStore = useAuthStore()
const syncStore = useSyncStore()

function handleOnline() {
  syncStore.setOnline(true)
  if (authStore.isAuthenticated) syncPendingRecords()
}
function handleOffline() {
  syncStore.setOnline(false)
}

onMounted(() => {
  syncStore.setOnline(navigator.onLine)
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})
onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>
