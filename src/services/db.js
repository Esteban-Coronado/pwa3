import { openDB } from 'idb'

const DB_NAME    = 'censopet-db'
const DB_VERSION = 1

let _db = null

async function getDB() {
  if (_db) return _db
  _db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Pending offline records store
      if (!db.objectStoreNames.contains('pending')) {
        const store = db.createObjectStore('pending', { keyPath: 'localId' })
        store.createIndex('by-type', 'type')
        store.createIndex('by-status', 'status')
      }
    },
  })
  return _db
}

// ── Public API ────────────────────────────────────────────────────

export async function savePending(type, payload) {
  const db = await getDB()
  const record = {
    localId: `${type}_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    type,        // 'persona' | 'mascota' | 'censo'
    status: 'pending',
    payload,
    createdAt: new Date().toISOString(),
  }
  await db.put('pending', record)
  return record
}

export async function getPendingByType(type) {
  const db = await getDB()
  return db.getAllFromIndex('pending', 'by-type', type)
}

export async function getAllPending() {
  const db = await getDB()
  const all = await db.getAll('pending')
  return all.filter((r) => r.status === 'pending')
}

export async function markSynced(localId) {
  const db = await getDB()
  const record = await db.get('pending', localId)
  if (record) {
    record.status = 'synced'
    await db.put('pending', record)
  }
}

export async function deleteSynced() {
  const db = await getDB()
  const all = await db.getAll('pending')
  const tx  = db.transaction('pending', 'readwrite')
  for (const r of all) {
    if (r.status === 'synced') await tx.store.delete(r.localId)
  }
  await tx.done
}

export async function countPending() {
  const all = await getAllPending()
  return all.length
}
