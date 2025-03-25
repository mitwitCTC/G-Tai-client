<script setup>
import TheLayout from '@/components/TheLayout.vue'
import { onMounted, ref } from 'vue'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
const cus_code = companyStore.company_info.customerId

let loadingInstance = null
import { ElLoading } from 'element-plus'
import apiServer from '@/apiServer'

const remittanceInfo = ref({})
async function getRemittanceInfo() {
  // 顯示 loading 遮罩
  loadingInstance = ElLoading.service({
    fullscreen: true,
    text: '載入中...',
    background: 'rgba(0, 0, 0, 0.5)'
  })
  try {
    const response = await apiServer.post('/main/searchCustomer', {
      cus_code: cus_code
    })
    remittanceInfo.value = {
      bank_code: '050',
      bank_name: '臺灣中小企業銀行',
      branch_name: '松江分行',
      account_name: '鉅泰創新股份有公司',
      account_number: response.data.data[0].virtual_account
    }
  } catch (error) {
    console.error(error)
    alert('載入匯款資料失敗，系統錯誤或網路不穩定！')
  } finally {
    loadingInstance.close()
  }
}
onMounted(() => {
  getRemittanceInfo()
})
</script>
<template>
  <TheLayout>
    <h3>匯款資訊</h3>
    <div class="d-flex justify-content-center">
      <div class="row">
      <div class="col-12">
        <div class="d-flex align-items-center mb-2">
          <h3 class="label">銀行代號</h3>
          <h3 class="colon">:</h3>
          <h3 class="value">{{ remittanceInfo.bank_code }}</h3>
        </div>
        <div class="d-flex align-items-center mb-2">
          <h3 class="label">銀行名稱</h3>
          <h3 class="colon">:</h3>
          <h3 class="value">{{ remittanceInfo.bank_name }}</h3>
        </div>
        <div class="d-flex align-items-center mb-2">
          <h3 class="label">分行名稱</h3>
          <h3 class="colon">:</h3>
          <h3 class="value">{{ remittanceInfo.branch_name }}</h3>
        </div>
        <div class="d-flex align-items-center mb-2">
          <h3 class="label">戶名</h3>
          <h3 class="colon">:</h3>
          <h3 class="value">{{ remittanceInfo.account_name }}</h3>
        </div>
        <div class="d-flex align-items-center mb-2">
          <h3 class="label">銀行帳號</h3>
          <h3 class="colon">:</h3>
          <h3 class="value">{{ remittanceInfo.account_number }}</h3>
        </div>
      </div>
    </div>

    </div>
  </TheLayout>
</template>
<style scoped>
.label {
  width: 4em;
  text-align: justify;
  text-align-last: justify;
}
.colon {
  width: 1em;
  text-align: center;
}
.value {
  text-align: left;
  flex-grow: 1;
}
</style>
