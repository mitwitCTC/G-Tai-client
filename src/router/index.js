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
    },
    {
      path: '/line-reconciliation-invoice',
      name: 'ReconciliationAndInvoiceForLine',
      component: () => import('@/views/LineReconciliationAndInvoice.vue')
    },
    {
      path: '/carbon-check',
      name: 'CarbonCheck',
      component: () => import('@/views/CarbonCheck.vue')
    },
    {
      path: '/vehicle-details',
      name: 'VehicleDetails',
      component: () => import('@/views/VehicleDetails.vue')
    },
    {
      path: '/station-details',
      name: 'StationDetails',
      component: () => import('@/views/StationDetails.vue')
    },
    {
      path: '/remittance-info',
      name: 'RemittanceInfo',
      component: () => import('@/views/RemittanceInfo.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = sessionStorage.getItem('token')

  if (to.name === 'ReconciliationAndInvoiceForLine') {
    next()
  } else if (to.name === 'login' && token) {
    next({ name: 'home' })
  } else if (to.name !== 'login' && !token) {
    next({ name: 'login' })
  } else {
    next()
  }
})
export default router
