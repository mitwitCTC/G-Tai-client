<script setup>
import { useSearchAccountStore } from '@/stores/accountStore'
import { ref, onMounted } from 'vue'
const searchAccountStore = useSearchAccountStore()
const bill_year = ref(searchAccountStore.searchAccount.search_month.split('-')[0])
const bill_month = ref(searchAccountStore.searchAccount.search_month.split('-')[1])

// 格式化數字
function formatNumber(value) {
  return value.toLocaleString('en-US')
}
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
</template>
