import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

import AuthLayout from '../layouts/AuthLayout.vue'
import AppLayout from '../layouts/AppLayout.vue'
import RouteViewComponent from '../layouts/RouterBypass.vue'

const routes: Array<RouteRecordRaw> = [
  // Redirect root "/" to login
  {
    path: '/',
    redirect: { name: 'login' },
  },

  // Catch-all unknown paths also go to login
  {
    path: '/:pathMatch(.*)*',
    redirect: { name: 'login' },
  },

  // Admin routes (protected)
  {
    name: 'admin',
    path: '/admin',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      {
        name: 'dashboard',
        path: 'dashboard',
        component: () => import('../pages/admin/dashboard/Dashboard.vue'),
      },
      {
        name: 'settings',
        path: 'settings',
        component: () => import('../pages/settings/Settings.vue'),
      },
      {
        name: 'preferences',
        path: 'preferences',
        component: () => import('../pages/preferences/Preferences.vue'),
      },
      {
        name: 'control-de-pagos',
        path: 'control-de-pagos',
        component: () => import('../pages/users/ControlPago.vue'),
      },
      {
        name: 'dashboard-bitcoin',
        path: 'dashboard-bitcoin',
        component: () => import('../pages/projects/RevenueHistoryBitcoinAcc.vue'),
      },
      {
        name: 'dashboard-grupo-dms',
        path: 'dashboard-grupo-dms',
        component: () => import('../pages/payments/RevenueHistoryDMSAcc.vue'),
      },
      {
        name: 'faq',
        path: 'faq',
        component: () => import('../pages/faq/FaqPage.vue'),
      },
    ],
  },

  // Auth routes
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        name: 'login',
        path: 'login',
        component: () => import('../pages/auth/Login.vue'),
      },
      {
        name: 'signup',
        path: 'signup',
        component: () => import('../pages/auth/Signup.vue'),
      },
      {
        name: 'recover-password',
        path: 'recover-password',
        component: () => import('../pages/auth/RecoverPassword.vue'),
      },
      {
        name: 'recover-password-email',
        path: 'recover-password-email',
        component: () => import('../pages/auth/CheckTheEmail.vue'),
      },
      {
        path: '',
        redirect: { name: 'login' },
      },
    ],
  },

  // 404 page (optional)
  {
    name: '404',
    path: '/404',
    component: () => import('../pages/404.vue'),
  },
]

const router = createRouter({
  // 🔹 Use hash mode for GitHub Pages
  history: createWebHashHistory(),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    window.scrollTo(0, 0)
  },
  routes,
})

// ✅ Global auth guard
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('report_token')

  // Protected routes (need login)
  if (to.meta.requiresAuth && !token) {
    return next({ name: 'login' })
  }

  // Prevent logged-in users from visiting login/signup pages
  if ((to.name === 'login' || to.name === 'signup') && token) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
