<script setup>
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
import { ref, onMounted } from 'vue'

// API 根路由
import apiClient from '@/api' // 載入 apiClient
// 格式化數字
function formatNumber(value) {
  return value.toLocaleString('en-US')
}
const company_info = ref({})
async function getCompany_info() {
  company_info.value = {
    year: '2024',
    month: '07',
    name: '日星交通事業有限公司',
    vat_number: '04995964', // 開立發票統編
    company_title: '永青遊覽有限公司', // 開立發票名稱
    acc_type: 'A', // 對帳單組別
    acc_No: '202407-0027' // 對帳單號
  }
}
onMounted(() => {
  getCompany_info()
})

// 確認交易方式為儲值或月結 (1為儲值；2為月結)
const transaction_mode = ref('')
function checkTransaction_mode() {
  transaction_mode.value = sessionStorage.getItem('token')
}
onMounted(() => {
  checkTransaction_mode()
})

const subtotal_data = ref({
  current_month_balance: 0,
  last_month_balance: 0,
  current_month_remittance_amount: 0,
  current_month_fuel_total: 0
})
// 取得匯款加油小計
async function fetchSubtotalData() {
  if (transaction_mode.value == 1) {
    try {
      const response = await apiClient.post('/main/monthlyBalance', {
        customerId: companyStore.company_info.customerId
      })
      subtotal_data.value.date = `${company_info.value.year - 1911}/${company_info.value.month}`
      subtotal_data.value.current_month_balance = Number(response.data.data[0].thisMonthOverage)
      subtotal_data.value.last_month_balance = Number(response.data.data[0].overage)
      subtotal_data.value.current_month_remittance_amount = Number(
        response.data.data[0].creditAmount
      )
      subtotal_data.value.current_month_fuel_total = Number(response.data.data[0].salesAmount)
    } catch (error) {
      console.error(error)
    }
  } else if (transaction_mode.value == 2) {
    subtotal_data.value[0] = {
      collateral_item: '現金',
      collateral_value: 50000,
      payment_deadline: '每月15日前'
    }
  }
}
onMounted(() => {
  fetchSubtotalData()
})
</script>
<template>
  <div class="container mt-5">
    <h3 class="text-center">鉅泰創新股份有限公司</h3>
    <p class="text-center">{{ company_info.year }} 年 {{ company_info.month }} 月對帳單</p>
    <div class="company-info">
      <p class="d-flex justify-content-between flex-md-row flex-column-reverse">
        <span
          >客戶名稱：
          <span>{{ company_info.name }}</span>
        </span>
        <span
          >對帳單號：
          <span>{{ company_info.acc_No }}</span>
        </span>
      </p>
      <p>
        開立發票統編：<span>{{ company_info.vat_number }}</span>
      </p>
      <p>
        開立發票名稱：<span>{{ company_info.company_title }}</span>
      </p>
      <p>
        對帳單組別：<span>{{ company_info.acc_type }}</span>
      </p>
    </div>
    <div class="subtotal-data">
      <el-table border :data="[subtotal_data]">
        <el-table-column align="center" min-width="80" prop="date" label="年月" />
        <el-table-column align="center" min-width="100" label="前期餘額">
          <template #default="{ row }">
            <span>{{ formatNumber(row.last_month_balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="230" label="*本期匯入金額(已扣除製卡費用)">
          <template #default="{ row }">
            <span>{{ formatNumber(row.current_month_remittance_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="120" label="本期使用金額">
          <template #default="{ row }">
            <span class="text-danger">{{ formatNumber(row.current_month_fuel_total) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="120" label="本期餘額">
          <template #default="{ row }">
            <span>{{ formatNumber(row.current_month_balance) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <p>*本期匯入金額已先預扣本期製卡費用</p>
    </div>
  </div>
</template>
