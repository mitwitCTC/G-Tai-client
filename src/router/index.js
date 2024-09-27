import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
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
    }
  ]
})

export default router
