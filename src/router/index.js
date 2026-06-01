import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore.js'

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { public: true },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/personas/nuevo',
    name: 'personas-nuevo',
    component: () => import('@/views/PersonaFormView.vue'),
    meta: { public: true },
  },
  {
    path: '/mascotas/nuevo',
    name: 'mascotas-nuevo',
    component: () => import('@/views/MascotaFormView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/censo/nuevo',
    name: 'censo-nuevo',
    component: () => import('@/views/CensoView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/mapa',
    name: 'mapa',
    component: () => import('@/views/MapView.vue'),
    meta: { requiresAuth: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/pwa3/' },
]

const router = createRouter({
  history: createWebHistory('/pwa3/'), 
  routes,
})

// Navigation guard
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login' }
  }
  if (to.name === 'login' && auth.isAuthenticated) {
    return { name: 'dashboard' }
  }
})

export default router
