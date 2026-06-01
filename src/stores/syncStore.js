import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSyncStore = defineStore('sync', () => {
  const isOnline      = ref(navigator.onLine)
  const pendingCount  = ref(0)
  const isSyncing     = ref(false)

  function setOnline(val)        { isOnline.value = val }
  function setPending(count)     { pendingCount.value = count }
  function setSyncing(val)       { isSyncing.value = val }

  return { isOnline, pendingCount, isSyncing, setOnline, setPending, setSyncing }
})
