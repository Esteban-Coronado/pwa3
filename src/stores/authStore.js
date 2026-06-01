import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Must match the key that suscripcion.js reads: localStorage.getItem("jwt_token")
const TOKEN_KEY = 'jwt_token'
const USER_KEY  = 'censopet_user'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || null)
  const user  = ref(JSON.parse(localStorage.getItem(USER_KEY) || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  function setSession(tokenValue, userData) {
    token.value = tokenValue
    user.value  = userData
    localStorage.setItem(TOKEN_KEY, tokenValue)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
  }

  function clearSession() {
    token.value = null
    user.value  = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  return { token, user, isAuthenticated, setSession, clearSession }
})
