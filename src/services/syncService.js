import api from './api.js'
import { getAllPending, markSynced, deleteSynced, countPending } from './db.js'
import { useSyncStore } from '@/stores/syncStore.js'

/**
 * Sends all pending offline records to the API.
 * Order: personas → mascotas → censos (respects FK dependencies).
 */
export async function syncPendingRecords() {
  const syncStore = useSyncStore()
  const pending = await getAllPending()
  if (pending.length === 0) return

  syncStore.setSyncing(true)

  const ORDER = ['persona', 'mascota', 'censo']
  const sorted = [...pending].sort(
    (a, b) => ORDER.indexOf(a.type) - ORDER.indexOf(b.type)
  )

  for (const record of sorted) {
    try {
      // Use _endpoint saved by the view (e.g. /personas vs /personas/registro)
      // Fall back to the static map only if not present.
      const endpoint = record.payload._endpoint || ENDPOINTS[record.type]
      if (!endpoint) continue

      // Strip _endpoint from the body before sending — the API rejects unknown fields
      const { _endpoint, ...body } = record.payload

      await api.post(endpoint, body)
      await markSynced(record.localId)
    } catch (err) {
      // Log the full API response body so the exact validation error is visible in console
      console.error(
        `[sync] ✗ Error sincronizando ${record.type}`,
        '\n  Status:', err.response?.status,
        '\n  API dice:', JSON.stringify(err.response?.data),
        '\n  Body enviado:', JSON.stringify(err.config?.data),
      )
    }
  }

  await deleteSynced()
  const remaining = await countPending()
  syncStore.setPending(remaining)
  syncStore.setSyncing(false)
}

const ENDPOINTS = {
  persona: '/api/v1/personas/registro',
  mascota: '/api/v1/mascotas',
  censo:   '/api/v1/censos',
}

export async function refreshPendingCount() {
  const syncStore = useSyncStore()
  const count = await countPending()
  syncStore.setPending(count)
}