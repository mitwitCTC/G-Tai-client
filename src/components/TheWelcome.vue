<script setup>
import { useCompanyStore } from '@/stores/companyStore'
import router from '@/router'
import { ref, onMounted, watch } from 'vue'
import { ElLoading } from 'element-plus'
const navItems = ref([
  {
    name: '客戶資料',
    path: '/general',
    icon_path: 'bi bi-file-earmark-text'
  },
  {
    name: '加油紀錄',
    path: '/fuel-record',
    icon_path: 'bi bi-fuel-pump'
  },
  {
    name: '匯款紀錄',
    path: '/transfer-record',
    icon_path: 'bi bi-cash-coin'
  },
  {
    name: '對帳及發票查詢',
    path: '/reconciliation-invoice',
    icon_path: 'bi bi-card-checklist'
  }
])
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

function logout() {
  sessionStorage.clear()
  router.push('/login')
}
</script>

<template>
  <div class="container">
    <div class="company-info mt-5 d-flex justify-content-between align-itemns-center">
      <h3>
        {{ company_info.customerName }}
        <span v-if="company_info.customerId">({{ company_info.customerId }})</span>
      </h3>
      <button class="btn btn-yellow" @click="logout">登出</button>
    </div>
    <ul class="nav-list mt-5">
      <li class="item" v-for="(item, index) in navItems" :key="index">
        <router-link :to="{
        path: item.path,
        query: { customerName: company_info.customerName }
      }">
          <div class="nav-body">
            <i :class="item.icon_path" class="nav-icon"></i>
            <p class="nav-text">{{ item.name }}</p>
          </div>
        </router-link>
      </li>
      <li class="item">
        <a href="https://page.line.me/a42993157?openQrModal=true">
          <div class="nav-body">
            <i class="bi bi-line"></i>
            <p class="nav-text">官方 Line</p>
          </div>
        </a>
      </li>
      <li class="item">
        <div class="nav-body">
          <i class="bi bi-shield-lock"></i>
          <p class="nav-text">變更密碼</p>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.item {
  flex: 1 1 20%; /* Allow items to grow/shrink with a base width of 20% */
  min-width: 150px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
  border-radius: 8px;
  background: #fff;
  transition: transform 0.2s;
}

.item:hover {
  transform: scale(1.05);
  background: #fcd25d;
  box-shadow: rgba(99, 99, 99, 0.5) 0px 2px 8px 0px;
}

.nav-body {
  padding: 15px;
  text-align: center;
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.nav-text {
  margin: 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
