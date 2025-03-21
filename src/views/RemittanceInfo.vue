<script setup>
import TheLayout from '@/components/TheLayout.vue'
import { onMounted, ref } from 'vue'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
const cus_code = companyStore.company_info.customerId

const isLoading = ref(false)
import { ElLoading } from 'element-plus'

const remittanceInfo = ref({})
async function getRemittanceInfo() {
  console.log(cus_code)
  // 顯示 loading 遮罩
  isLoading.value = ElLoading.service({
    fullscreen: true,
    text: '載入中...',
    background: 'rgba(0, 0, 0, 0.5)'
  })
  remittanceInfo.value = {
    bank: 'XX銀行',
    branch: 'OO分行',
    account_number: '0091234567890'
  }
  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}
onMounted(() => {
  getRemittanceInfo()
})
</script>
<template>
  <TheLayout>
    <h3 class="mt-3 text-center">
      銀行：
      {{ remittanceInfo.bank }}
    </h3>
    <h3 class="text-center">
      分行：
      {{ remittanceInfo.branch }}
    </h3>
    <h3 class="text-center">
      帳號：
      {{ remittanceInfo.account_number }}
    </h3>
  </TheLayout>
</template>
