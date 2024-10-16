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

const car_summary_data = ref([])
// 取得車輛加油概要資料
async function fetchCarSummaryData() {
  car_summary_data.value = [
    {
      year_month: '113/07', //年月
      plate: '366-ZZ', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 2287.91, // 公升數合計
      list_price_subtotal: 61012, // 牌價合計
      subtotal: 57579, // 售價合計
      mileage: 6301, // 總里程數
      fuel_consumption: 3.19 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: '843-TT', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 1868.6, // 公升數合計
      list_price_subtotal: 49783, // 牌價合計
      subtotal: 46981, // 售價合計
      mileage: 5036, // 總里程數
      fuel_consumption: 3.13 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: '845-TT', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 934.85, // 公升數合計
      list_price_subtotal: 24767, // 牌價合計
      subtotal: 23365, // 售價合計
      mileage: 2217, // 總里程數
      fuel_consumption: 2.58 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: 'KAC-0657', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 1309.18, // 公升數合計
      list_price_subtotal: 35050, // 牌價合計
      subtotal: 33087, // 售價合計
      mileage: 2647, // 總里程數
      fuel_consumption: 2.51 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: 'KAC-3719', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 545.65, // 公升數合計
      list_price_subtotal: 14547, // 牌價合計
      subtotal: 13729, // 售價合計
      mileage: 1791, // 總里程數
      fuel_consumption: 3.78 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: 'KAC-3719', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 545.65, // 公升數合計
      list_price_subtotal: 14547, // 牌價合計
      subtotal: 13729, // 售價合計
      mileage: 1791, // 總里程數
      fuel_consumption: 3.78 // 油耗
    }
  ]
}
onMounted(() => {
  fetchCarSummaryData()
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
    <div class="car_summary_data">
      <el-table border :data="car_summary_data" height="300">
        <el-table-column align="center" min-width="80" prop="year_month" label="年月" />
        <el-table-column align="center" min-width="100" prop="plate" label="車牌號碼" />
        <el-table-column align="center" min-width="120" prop="product_name" label="油品" />
        <el-table-column align="center" min-width="100" label="公升數合計">
          <template #default="{ row }">
            <span>{{ formatNumber(row.quantity) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="牌價合計">
          <template #default="{ row }">
            <span>{{ formatNumber(row.list_price_subtotal) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="售價合計">
          <template #default="{ row }">
            <span>{{ formatNumber(row.subtotal) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="總里程數">
          <template #default="{ row }">
            <span>{{ formatNumber(row.mileage) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="油耗">
          <template #default="{ row }">
            <span>{{ formatNumber(row.fuel_consumption) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
