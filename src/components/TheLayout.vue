<script setup>
import { ref, onMounted, watch } from 'vue'
import { ElLoading } from 'element-plus'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
const company_info = ref({ customerId: '', customerName: '' })
let loadingInstance = null
function fetchCompanyInfo() {
  // 顯示 loading 遮罩
  loadingInstance = ElLoading.service({
    fullscreen: true,
    text: '載入中...',
    background: 'rgba(0, 0, 0, 0.5)'
  })

  const storedInfo = sessionStorage.getItem('company_info')
  if (storedInfo) {
    company_info.value = JSON.parse(storedInfo)
    setTimeout(() => {
      loadingInstance.close()
    }, 1000)
  } else {
    watch(
      () => companyStore.company_info,
      (newInfo) => {
        if (newInfo.customerName) {
          company_info.value = newInfo
          sessionStorage.setItem('company_info', JSON.stringify(newInfo))
          setTimeout(() => {
            loadingInstance.close()
          }, 1000)
        }
      },
      { immediate: true }
    )
  }
}
onMounted(() => {
  fetchCompanyInfo()
})

import router from '@/router'
function logout() {
  sessionStorage.clear()
  router.push('/login')
}
</script>
<template>
  <div class="container">
    <div class="company-info mt-5">
        <div class="d-flex justify-content-between align-items-center">
            <router-link to="/">
                <button class="btn btn-yellow mb-2">回首頁</button>
            </router-link>
            <button class="btn btn-yellow" @click="logout">登出</button>
        </div>
        <h3>
          {{ company_info.customerName }}
          <span v-if="company_info.customerId">({{ company_info.customerId }})</span>
        </h3>
    </div>
    <slot />
  </div>
</template>
