<script setup>
// import { useCompanyStore } from '@/stores/companyStore'
// const companyStore = useCompanyStore()
import { useSearchAccountStore } from '@/stores/accountStore'
import { ref, onMounted } from 'vue'
const searchAccountStore = useSearchAccountStore()
const bill_year = ref(searchAccountStore.searchAccount.date.split('-')[0])
const bill_month = ref(searchAccountStore.searchAccount.date.split('-')[1])

// 格式化數字
function formatNumber(value) {
  return value.toLocaleString('en-US')
}

// API 根路由
import apiClient from '@/api' // 載入 apiClient
const isLoading = ref(false)
const car_summary_data = ref([])
// 取得車輛加油概要資料
async function fetchCarSummaryData() {
  isLoading.value = true
  try {
    const response = await apiClient.post('/main/accountStatement', {
      date: searchAccountStore.searchAccount.date,
      customerId: searchAccountStore.searchAccount.customerId,
      account_sortId: searchAccountStore.searchAccount.account_sortId
    })
    car_summary_data.value = response.data.data.map((item) => ({
      year_month: bill_year.value - 1911 + '/' + bill_month.value,
      plate: item.license_plate,
      product_name: item.product_name, // 品項(油品)
      quantity: item.fuel_volume, // 公升數合計
      list_price_subtotal: formatNumber(Number(item.reference_amount)), // 售價合計
      subtotal: formatNumber(Number(item.amount)), // 售價合計
      mileage: item.mileage ? formatNumber(Number(item.mileage)) : 0, // 總里程數
      fuel_consumption: item.fuel_consumption ? formatNumber(Number(item.fuel_consumption)) : 0 // 油耗
    }))
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
onMounted(() => {
  fetchCarSummaryData()
})

function logout() {
  sessionStorage.removeItem('token')
  this.$router.push('/login')
}
</script>
<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center">
      <router-link to>
        <button class="btn btn-yellow mb-2" @click="$router.back(-1)">回上頁</button>
      </router-link>
      <button class="btn btn-yellow" @click="logout">登出</button>
    </div>
    <h4 class="text-center mb-3">
      <span>{{ bill_year }}年</span>
      <span>{{ bill_month }}月</span>
      <span>對帳單總表</span>
    </h4>
    <el-table border :data="car_summary_data" height="300" v-loading="isLoading">
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
</template>
