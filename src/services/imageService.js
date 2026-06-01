const MAX_KB = 50
const MAX_BYTES = MAX_KB * 1024

/**
 * Converts a File/Blob to Base64 data URL string.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Returns the size in KB of a Base64 data URL.
 * Base64 uses ~4/3 ratio so actual binary size ≈ length * 0.75
 */
export function base64SizeKb(dataUrl) {
  const base64 = dataUrl.split(',')[1] || dataUrl
  return (base64.length * 0.75) / 1024
}

/**
 * Compresses a canvas-drawn image iteratively until it fits under MAX_KB.
 * Returns the Base64 data URL or null if the image cannot be compressed enough.
 */
export async function compressToLimit(imageSource) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')

      // Start at original size, scale down if needed
      let width  = img.naturalWidth  || img.width
      let height = img.naturalHeight || img.height

      // Cap max dimension to 800px to start small
      const MAX_DIM = 800
      if (width > MAX_DIM || height > MAX_DIM) {
        const ratio = Math.min(MAX_DIM / width, MAX_DIM / height)
        width  = Math.round(width  * ratio)
        height = Math.round(height * ratio)
      }

      canvas.width  = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      // Try decreasing JPEG quality until it fits
      let quality = 0.85
      let result  = canvas.toDataURL('image/jpeg', quality)

      while (base64SizeKb(result) > MAX_KB && quality > 0.05) {
        quality -= 0.07
        result = canvas.toDataURL('image/jpeg', Math.max(quality, 0.05))
      }

      // If still too big, also shrink dimensions
      if (base64SizeKb(result) > MAX_KB) {
        let scale = 0.7
        while (base64SizeKb(result) > MAX_KB && scale > 0.1) {
          canvas.width  = Math.round(width  * scale)
          canvas.height = Math.round(height * scale)
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          result = canvas.toDataURL('image/jpeg', 0.5)
          scale -= 0.1
        }
      }

      resolve(base64SizeKb(result) <= MAX_KB ? result : null)
    }
    img.onerror = () => resolve(null)
    img.src = typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource)
  })
}

/**
 * Captures a frame from a <video> element and returns a compressed Base64 string.
 */
export async function captureFromVideo(videoEl) {
  const canvas = document.createElement('canvas')
  canvas.width  = videoEl.videoWidth  || 640
  canvas.height = videoEl.videoHeight || 480
  const ctx = canvas.getContext('2d')
  ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
  return compressToLimit(dataUrl)
}
