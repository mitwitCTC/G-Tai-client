<script setup>
import { useSearchAccountStore } from '@/stores/accountStore'
import { ref, onMounted } from 'vue'
import router from '@/router'
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
const searchAccountStore = useSearchAccountStore()
const bill_year = ref(searchAccountStore.searchAccount.date.split('-')[0])
const bill_month = ref(searchAccountStore.searchAccount.date.split('-')[1])

// 格式化數字
function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : value
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
      quantity: Number(item.fuel_volume), // 公升數合計
      list_price_subtotal: Number(item.reference_amount), // 牌價合計
      subtotal: Number(item.amount), // 售價合計
      mileage: item.mileage ? Number(item.mileage) : 0, // 總里程數
      fuel_consumption: item.fuel_consumption ? Number(item.fuel_consumption) : 0 // 油耗
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

// 匯出
function exportExcel() {
  let xlsxParam = { raw: true }
  let wb = XLSX.utils.table_to_book(document.querySelector('#car_summary_data'), xlsxParam)

  // 獲取工作表
  let ws = wb.Sheets[wb.SheetNames[0]]

  // 設置儲存格格式
  let range = XLSX.utils.decode_range(ws['!ref'])

  // 中文欄位名稱與英文變數名稱的對應表
  const fieldMap = {
    公升數合計: 'quantity',
    牌價合計: 'list_price_subtotal',
    售價合計: 'subtotal',
    總里程數: 'mileage',
    油耗: 'fuel_consumption'
  }

  const numberFields = [
    'quantity',
    'list_price_subtotal',
    'subtotal',
    'mileage',
    'fuel_consumption'
  ]

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let cell_address = { c: C, r: R }
      let cell_ref = XLSX.utils.encode_cell(cell_address)
      let cell = ws[cell_ref]

      if (!cell) continue
      if (!ws[cell_ref].s) ws[cell_ref].s = {}

      // 設置對齊方式
      ws[cell_ref].s.alignment = { horizontal: 'center', vertical: 'center' }

      // 取得欄位名稱，進行對應映射
      let columnHeader = ws[XLSX.utils.encode_cell({ c: C, r: 0 })].v.toString().trim()

      // 若欄位名稱在 fieldMap 中，且符合 numberFields
      if (R > 0 && numberFields.includes(fieldMap[columnHeader])) {
        cell.t = 'n' // 確保儲存格是數字格式
        if (isNaN(cell.v)) {
          cell.v = 0 // 若儲存格的值不是數字，則預設為 0
        }
      }
    }
  }

  // 設置欄位寬度
  let colWidths = []
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 0 // 不設置初始寬度，讓其動態增大
    for (let R = range.s.r; R <= range.e.r; ++R) {
      let cell_address = { c: C, r: R }
      let cell_ref = XLSX.utils.encode_cell(cell_address)
      let cell = ws[cell_ref]

      if (!cell || !cell.v) continue
      let cellValue = cell.v.toString()

      // 針對中文及英文字元做不同的長度調整
      let adjustedLength = cellValue.length
      if (/[\u4e00-\u9fa5]/.test(cellValue)) {
        // 如果包含中文字元，字元寬度需要更大，這裡假設中文字佔用兩個單位寬度
        adjustedLength = cellValue.length * 2
      }

      // 找出此列中最長的內容長度，並動態設置最大寬度
      maxWidth = Math.max(maxWidth, adjustedLength)
    }

    // 避免過窄欄位，設置最小寬度為 10
    colWidths.push({ wch: Math.max(maxWidth, 10) })
  }
  ws['!cols'] = colWidths

  // 將工作簿寫出
  const wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'array' })
  try {
    FileSaver.saveAs(
      new Blob([wbout], { type: 'application/octet-stream' }),
      `${bill_year.value}-${bill_month.value}對帳單總表.xlsx`
    )
  } catch (e) {
    if (console) {
      console.log(e, wbout)
    }
  }
  return wbout
}

function logout() {
  sessionStorage.clear()
  router.push('/login')
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
    <div class="d-flex justify-content-end mb-3">
      <button class="btn btn-warning" @click="exportExcel">匯出</button>
    </div>
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
    <el-table border :data="car_summary_data" id="car_summary_data" class="d-none">
      <el-table-column align="center" min-width="80" prop="year_month" label="年月" />
      <el-table-column align="center" min-width="100" prop="plate" label="車牌號碼" />
      <el-table-column align="center" min-width="120" prop="product_name" label="油品" />
      <el-table-column align="center" min-width="100" prop="quantity" label="公升數合計" />
      <el-table-column align="center" min-width="100" prop="list_price_subtotal" label="牌價合計" />
      <el-table-column align="center" min-width="100" prop="subtotal" label="售價合計" />
      <el-table-column align="center" min-width="100" prop="mileage" label="總里程數" />
      <el-table-column align="center" min-width="100" prop="fuel_consumption" label="油耗" />
    </el-table>
  </div>
</template>
