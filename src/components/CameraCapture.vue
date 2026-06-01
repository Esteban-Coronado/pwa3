<template>
  <div class="camera-wrap">
    <!-- Toolbar -->
    <div class="cam-toolbar">
      <select v-model="facingMode" class="cam-select">
        <option value="environment">Cámara trasera</option>
        <option value="user">Cámara frontal</option>
      </select>
      <button type="button" class="btn btn-ghost btn-sm" @click="toggleCamera">
        {{ streamActive ? 'Cerrar' : 'Abrir cámara' }}
      </button>
      <label class="btn btn-ghost btn-sm file-label">
        Subir foto
        <input type="file" accept="image/*" class="file-input" @change="onFileChange" />
      </label>
    </div>

    <!-- Video stream -->
    <video
      v-show="streamActive"
      ref="videoEl"
      autoplay
      playsinline
      class="cam-video"
    ></video>

    <!-- Capture button -->
    <button
      v-if="streamActive"
      type="button"
      class="btn btn-primary btn-full"
      @click="capture"
    >
      📸 Tomar foto
    </button>

    <!-- Preview -->
    <div class="preview-box" :class="{ 'has-photo': !!modelValue }">
      <img v-if="modelValue" :src="modelValue" alt="Vista previa" class="preview-img" />
      <span v-else class="preview-placeholder">La foto aparecerá aquí</span>
    </div>

    <!-- Size info -->
    <div v-if="modelValue" class="size-info" :class="sizeOk ? 'size-ok' : 'size-error'">
      {{ sizeOk ? '✓' : '✗' }} {{ sizeLabel }}
    </div>

    <p v-if="error" class="helper-error">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { captureFromVideo, compressToLimit, base64SizeKb } from '@/services/imageService.js'

const props = defineProps({ modelValue: { type: String, default: '' } })
const emit  = defineEmits(['update:modelValue'])

const videoEl    = ref(null)
const facingMode = ref('environment')
const streamRef  = ref(null)
const streamActive = ref(false)
const error      = ref('')

const sizeKb = computed(() => props.modelValue ? base64SizeKb(props.modelValue) : 0)
const sizeOk = computed(() => sizeKb.value <= 50)
const sizeLabel = computed(() => `${sizeKb.value.toFixed(1)} Kb / 50 Kb máx.`)

async function toggleCamera() {
  if (streamActive.value) {
    stopStream()
    return
  }
  error.value = ''
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode.value },
      audio: false,
    })
    streamRef.value = stream
    videoEl.value.srcObject = stream
    streamActive.value = true
  } catch (e) {
    error.value = `No se pudo acceder a la cámara: ${e.message}`
  }
}

function stopStream() {
  streamRef.value?.getTracks().forEach((t) => t.stop())
  streamRef.value = null
  streamActive.value = false
}

async function capture() {
  error.value = ''
  const result = await captureFromVideo(videoEl.value)
  if (!result) {
    error.value = 'No se pudo comprimir la imagen a menos de 50 Kb. Intenta con mejor luz.'
    return
  }
  emit('update:modelValue', result)
  stopStream()
}

async function onFileChange(event) {
  error.value = ''
  const file = event.target.files?.[0]
  if (!file) return
  const result = await compressToLimit(file)
  if (!result) {
    error.value = 'La imagen no puede reducirse a menos de 50 Kb. Usa una imagen más pequeña.'
    return
  }
  emit('update:modelValue', result)
  event.target.value = ''
}

onUnmounted(stopStream)
</script>

<style scoped>
.camera-wrap { display: flex; flex-direction: column; gap: 10px; }

.cam-toolbar { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; }
.cam-select { background: var(--surface2); border: 1.5px solid var(--border); border-radius: var(--radius-md); color: var(--text); font-family: inherit; font-size: 0.85rem; padding: 10px 12px; }

.cam-video { width: 100%; max-height: 260px; border-radius: var(--radius-lg); object-fit: cover; background: #000; border: 1px solid var(--border); }

.preview-box { min-height: 160px; border-radius: var(--radius-lg); border: 1.5px dashed var(--border); background: var(--surface2); display: grid; place-items: center; overflow: hidden; }
.preview-box.has-photo { border-style: solid; border-color: var(--yellow); }
.preview-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.preview-placeholder { color: var(--muted); font-size: 0.9rem; padding: 16px; text-align: center; }

.size-info { font-size: 0.8rem; font-weight: 600; padding: 6px 10px; border-radius: 8px; }
.size-ok    { background: rgba(74,222,128,0.1); color: var(--success); }
.size-error { background: rgba(248,113,113,0.1); color: var(--error); }

.file-label { cursor: pointer; }
.file-input { display: none; }
</style>
