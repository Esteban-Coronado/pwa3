/**
 * Resolves with { lat, lon } or rejects with an error message.
 */
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('La geolocalización no está soportada por este navegador.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(new Error(`No se pudo obtener la ubicación: ${err.message}`)),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    )
  })
}
