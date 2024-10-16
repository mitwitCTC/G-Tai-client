import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue')
    },
    {
      path: '/general',
      name: 'general',
      component: () => import('@/views/GeneralView.vue')
    },
    {
      path: '/fuel-record',
      name: 'FuelRecord',
      component: () => import('@/views/FuelRecord.vue')
    },
    {
      path: '/transfer-record',
      name: 'TransferRecord',
      component: () => import('@/views/TransferRecord.vue')
    },
    {
      path: '/reconciliation-invoice',
      name: 'ReconciliationAndInvoice',
      component: () => import('@/views/ReconciliationAndInvoice.vue')
    },
    {
      path: '/reconciliation-list',
      name: 'Reconciliation-list',
      component: () => import('@/views/ReconciliationList.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('token')

  if (to.name === 'login' && token) {
    next({ name: 'home' })
  } else if (to.name !== 'login' && !token) {
    next({ name: 'login' })
  } else {
    next()
  }
})
export default router
