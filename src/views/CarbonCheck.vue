<script setup>
import TheLayout from '@/components/TheLayout.vue'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
import { ref, watch, computed, onMounted } from 'vue'
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
const cus_code = companyStore.company_info.customerId

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const current_month = ref(String(today.getMonth() + 1).padStart(2, '0'))
const search_month = ref(`${currentYear}-${current_month.value}`)
const currentMonth = ref('')

function updateCurrentMonth() {
  if (search_month.value) {
    currentMonth.value = search_month.value.split('-')[1]
  } else {
    currentMonth.value = ''
  }
}

import { fetchWithRetry } from '@/services/fetchWithRetry'
// 最後更新時間
const update_time = ref('')
// 取得最後更新時間
async function fetchUpdateTime() {
  try {
    const response = await fetchWithRetry('/main/lastUpdateTime', {
      customerId: cus_code
    })
    update_time.value = response.data.data
  } catch (error) {
    console.error(error)
  }
}
onMounted(() => {
  fetchUpdateTime()
})

// loading 狀態
const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `
const isLoadingFuel_record = ref(false)

const fuel_record = ref([])

// 搜尋加油紀錄
async function fetchFuelData() {
  fetchUpdateTime()
  updateCurrentMonth()
  isLoadingFuel_record.value = true
  try {
    const response = await fetchWithRetry('/main/balanceInquiry', {
      date: search_month.value,
      customerId: cus_code
    })
    fuel_record.value = response.data.data.map((item) => ({
      team: item.acc_name,
      transaction_date: item.trade_time.split(' ')[0].replace(/\//g, '-'),
      transaction_time: item.trade_time.split(' ')[1],
      plate: item.license_plate,
      station: item.station_name,
      product_name: getProductName(item.fuel_type),
      mileage: Number(item.mileage) || 0,
      carbon_emission: Number(item.carbon_emission) || 0,
      emission_factor: Number(item.emission_factor) || 0,
    }))
  } catch (error) {
    console.error(error)
    alert('載入交易明細資料失敗，系統錯誤或網路不穩定！')
    fuel_record.value = []
  } finally {
    isLoadingFuel_record.value = false
  }
}

// 調整油品欄位資料
function getProductName(fuelType) {
  let productName = fuelType.split(' ')[1] || fuelType
  const fuelTypes = ['92無鉛', '95無鉛', '98無鉛']

  if (fuelTypes.some((type) => productName.startsWith(type))) {
    productName += '汽油'
  }

  return productName
}

// 確認交易方式為儲值或月結 (1為儲值；2為月結)
const transaction_mode = ref('')
function checkTransaction_mode() {
  transaction_mode.value = sessionStorage.getItem('token')
}
onMounted(() => {
  checkTransaction_mode()
})

watch(search_month, () => {
  fetchFuelData()
  plate.value = ''
})
onMounted(() => {
  fetchFuelData()
})

// 格式化數字
function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : value
}

const plate = ref('')
// 以車牌搜尋加油交易明細
const filteredFuelData = computed(() => {
  const trimmedPlate = plate.value.trim().toUpperCase()
  if (trimmedPlate === '') {
    return fuel_record.value
  }
  return fuel_record.value.filter((item) => item.plate.includes(trimmedPlate))
})

// 匯出
function exportExcel() {
  let xlsxParam = { raw: true }
  let wb = XLSX.utils.table_to_book(document.querySelector('#carbon_data'), xlsxParam)

  // 獲取工作表
  let ws = wb.Sheets[wb.SheetNames[0]]

  // 設置儲存格格式
  let range = XLSX.utils.decode_range(ws['!ref'])

  // 中文欄位名稱與英文變數名稱的對應表
  const fieldMap = {
    里程數: 'mileage',
    '碳排放量(kg)': 'carbon_emission',
    排放係數: 'emission_factor'
  }

  const formatRules = {
    mileage: '#,##',
    carbon_emission: '#,##0.00',
    emission_factor: '#,##0.00',
  }

  const numberFields = Object.keys(formatRules)

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
      let columnHeader = ws[XLSX.utils.encode_cell({ c: C, r: 0 })]?.v?.toString()?.trim()

      if (R > 0 && fieldMap[columnHeader]) {
        const field = fieldMap[columnHeader]
        if (numberFields.includes(field)) {
          cell.t = 'n' // 確保儲存格是數字格式
          cell.z = formatRules[field] // 設置格式
          if (isNaN(cell.v)) {
            cell.v = 0 // 若儲存格的值不是數字，則預設為 0
          }
        } else if (!isNaN(cell.v)) {
          // 對其他數字欄位使用預設千分位格式
          cell.t = 'n'
          cell.z = '#,##0'
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
      `${currentMonth.value}月碳排放量.xlsx`
    )
  } catch (e) {
    if (console) {
      console.log(e, wbout)
    }
  }
  return wbout
}
</script>

<template>
  <TheLayout>
    <p class="text-end" v-if="update_time != '無最後更新時間'">
      最後資料更新時間：{{ update_time }}
    </p>
    <span>查詢帳戶月份：</span>
    <el-date-picker
      v-model="search_month"
      type="month"
      format="YYYY-MM"
      value-format="YYYY-MM"
      placeholder="請選擇查詢帳戶月份"
      :disabled="isLoadingSubtotal_data || isLoadingFuel_record"
    />
    <div class="d-flex justify-content-between align-items-center my-3">
      <p class="m-0">{{ currentMonth }}月份碳排量</p>
      <button class="btn btn-warning" @click="exportExcel" :disabled="isLoadingFuel_record">
        匯出
      </button>
    </div>

    <div class="search d-flex mb-3 col-12 col-md-3">
      <el-input v-model="plate" placeholder="請輸入車牌搜尋" clearable></el-input>
    </div>

    <el-table
      class="mb-3"
      :data="filteredFuelData"
      stripe
      height="350"
      v-loading="isLoadingFuel_record"
      element-loading-text="資料載入中..."
      :element-loading-spinner="svg"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    >
      <el-table-column align="center" min-width="200" prop="team" label="使用單位" />
      <el-table-column
        align="center"
        min-width="110"
        sortable
        prop="transaction_date"
        label="交易日期"
      />
      <el-table-column
        align="center"
        min-width="110"
        sortable
        prop="transaction_time"
        label="交易時間"
      />
      <el-table-column align="center" min-width="110" prop="plate" label="車牌號碼" />
      <el-table-column align="center" min-width="170" prop="station" label="加油站" />
      <el-table-column align="center" min-width="120" prop="product_name" label="產品名稱" />
      <el-table-column align="center" min-width="110" prop="mileage" label="里程數">
        <template #default="{ row }">
          <span>{{ formatNumber(row.mileage) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" min-width="110" prop="mileage" label="碳排放量(kg)">
        <template #default="{ row }">
          <span>{{ formatNumber(row.carbon_emission) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" min-width="110" prop="mileage" label="排放係數">
        <template #default="{ row }">
          <span>{{ formatNumber(row.emission_factor) }}</span>
        </template>
      </el-table-column>
    </el-table>
    <el-table class="d-none" :data="filteredFuelData" id="carbon_data">
      <el-table-column align="center" min-width="110" prop="team" label="使用單位" />
      <el-table-column
        align="center"
        min-width="110"
        sortable
        prop="transaction_date"
        label="交易日期"
      />
      <el-table-column
        align="center"
        min-width="110"
        sortable
        prop="transaction_time"
        label="交易時間"
      />
      <el-table-column align="center" min-width="110" prop="plate" label="車牌號碼" />
      <el-table-column align="center" min-width="130" prop="station" label="加油站" />
      <el-table-column align="center" min-width="110" prop="product_name" label="產品名稱" />
      <el-table-column align="center" min-width="110" prop="mileage" label="里程數" />
      <el-table-column align="center" min-width="110" prop="carbon_emission" label="碳排放量(kg)" />
      <el-table-column align="center" min-width="110" prop="emission_factor" label="排放係數" />
    </el-table>
  </TheLayout>
</template>

<style scoped></style>
