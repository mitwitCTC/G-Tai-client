<script setup>
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
import { ref, watch, computed, onMounted } from 'vue'
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
import router from '@/router'
const cus_code = companyStore.company_info.customerId
const customerName = companyStore.company_info.customerName

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

// API 根路由
import apiClient from '@/api' // 載入 apiClient
// 最後更新時間
const update_time = ref('')
// 取得最後更新時間
async function fetchUpdateTime() {
  try {
    const response = await apiClient.post('/main/lastUpdateTime', {
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
const isLoadingSubtotal_data = ref(false)
const isLoadingFuel_record = ref(false)

const subtotal_data = ref({})

// 小計表格 label
const subtotal_data_table_labels = computed(() => {
  // 儲值方式的資訊
  if (transaction_mode.value == 1) {
    // 計算前一個月份
    const previous_month = currentMonth.value == 1 ? 12 : currentMonth.value - 1
    return [
      { label: `${currentMonth.value}月份餘額`, prop: 'current_month_balance' },
      { label: '', prop: 'equal_sign' },
      { label: `${previous_month}月份餘額`, prop: 'last_month_balance' },
      { label: '', prop: 'plus_sign' },
      { label: `${currentMonth.value}月份匯款`, prop: 'current_month_remittance_amount' },
      { label: '', prop: 'minus_sign' },
      { label: `${currentMonth.value}月份加油小計`, prop: 'current_month_fuel_total' }
    ]
  }
  return []
})

const collateral_data = ref([])
// 取得匯款加油小計
async function fetchSubtotalData() {
  updateCurrentMonth()
  if (transaction_mode.value == 1) {
    isLoadingSubtotal_data.value = true
    try {
      const response = await apiClient.post('/main/monthlyBalance', {
        date: search_month.value,
        customerId: cus_code
      })
      subtotal_data.value.current_month_balance = formatNumber(
        Number(response.data.data[0].thisMonthOverage)
      )
      subtotal_data.value.last_month_balance = formatNumber(Number(response.data.data[0].overage))
      subtotal_data.value.current_month_remittance_amount = formatNumber(
        Number(response.data.data[0].creditAmount)
      )
      subtotal_data.value.current_month_fuel_total = formatNumber(
        Number(response.data.data[0].salesAmount)
      )
    } catch (error) {
      console.error(error)
    } finally {
      isLoadingSubtotal_data.value = false
    }
  } else if (transaction_mode.value == 2) {
    isLoadingSubtotal_data.value = true
    try {
      const response = await apiClient.post('/main/collateralInfo', {
        cus_code: cus_code
      })
      const rawData = response.data.data[0]
      const configNotes = rawData.config_notes || ''
      const remittanceDate = rawData.remittance_date

      const parsedData = parseCollateralData(configNotes)
      const paymentDeadline = remittanceDate ? `每月${remittanceDate}日前` : ''

      // 如果 parsedData 為空，僅添加款項繳費期限
      if (parsedData.length === 0) {
        collateral_data.value.push({
          collateralType: '',
          collateralAmount: '',
          paymentDeadline
        })
      } else {
        parsedData.forEach((item) => {
          collateral_data.value.push({
            collateralType: item.type,
            collateralAmount: item.amount,
            paymentDeadline
          })
        })
      }
    } catch (error) {
      console.error(error)
    } finally {
      isLoadingSubtotal_data.value = false
    }
  }
}
// 調整擔保品資料格式
function parseCollateralData(data) {
  const result = []
  data.split(', ').forEach((entry) => {
    const [type, value] = entry.split(':').map((item) => item.trim())
    const numericValueMatch = value.match(/^\d+/) // 提取前面的數字部分
    if (numericValueMatch) {
      const numericValue = parseInt(numericValueMatch[0], 10)
      if (numericValue > 0) {
        result.push({
          type,
          amount: formatNumber(numericValue)
        })
      }
    }
  })
  return result
}

const fuel_record = ref([])

// 搜尋加油紀錄
async function fetchFuelData() {
  fetchSubtotalData()
  fetchUpdateTime()
  isLoadingFuel_record.value = true
  try {
    const response = await apiClient.post('/main/balanceInquiry', {
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
      quantity: Number(item.fuel_volume) || 0,
      unit_price: Number(item.reference_price) || 0,
      discount: Number(item.discount) || 0,
      list_price_subtotal: Number(item.reference_amount) || 0,
      discount_subtotal: Number(item.discount_amount) || 0,
      subtotal: Number(item.salesAmount) || 0,
      mileage: Number(item.mileage) || 0,
    }))
  } catch (error) {
    console.error(error)
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
  let wb = XLSX.utils.table_to_book(document.querySelector('#fuel_data'), xlsxParam)

  // 獲取工作表
  let ws = wb.Sheets[wb.SheetNames[0]]

  // 設置儲存格格式
  let range = XLSX.utils.decode_range(ws['!ref'])

  // 中文欄位名稱與英文變數名稱的對應表
  const fieldMap = {
    數量: 'quantity',
    單價: 'unit_price',
    折讓: 'discount',
    牌價小計: 'list_price_subtotal',
    折讓小計: 'discount_subtotal',
    售價小計: 'subtotal',
    里程數: 'mileage',
  }

  const formatRules = {
    quantity: '#,##0.00', // 數量保留兩位小數
    unit_price: '#,##0.0', // 單價保留一位小數
    discount: '#,##0.0', // 折讓保留兩位小數
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
      `${currentMonth.value}月加油交易明細.xlsx`
    )
  } catch (e) {
    if (console) {
      console.log(e, wbout)
    }
  }
  return wbout
}

// 登出
function logout() {
  sessionStorage.clear()
  router.push('/login')
}
</script>

<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center">
      <router-link to="/">
        <button class="btn btn-yellow mb-2">回首頁</button>
      </router-link>
      <button class="btn btn-yellow" @click="logout">登出</button>
    </div>
    <h3>
      {{ customerName }}
      <span>({{ cus_code }})</span>
    </h3>
    <p class="text-end" v-if="update_time != '無最後更新時間'">
      最後資料更新時間：{{ update_time }}
    </p>
    <el-table
      v-if="transaction_mode == 1"
      class="mb-3"
      border
      :data="[subtotal_data]"
      v-loading="isLoadingSubtotal_data"
    >
      <el-table-column
        align="center"
        :min-width="
          item.prop === 'equal_sign' || item.prop === 'plus_sign' || item.prop === 'minus_sign'
            ? '50'
            : '130'
        "
        v-for="(item, index) in subtotal_data_table_labels"
        :key="index"
        :label="item.label"
      >
        <template #default="scope">
          <!-- 判斷符號欄位 -->
          <span v-if="item.prop === 'equal_sign'">=</span>
          <span v-else-if="item.prop === 'plus_sign'">+</span>
          <span v-else-if="item.prop === 'minus_sign'">-</span>
          <!-- 渲染數值 -->
          <span v-else>
            {{ scope.row[item.prop] }}
          </span>
        </template>
      </el-table-column>
    </el-table>
    <el-table v-else class="mb-3" border :data="collateral_data" v-loading="isLoadingSubtotal_data">
      <el-table-column align="center" min-width="100" prop="collateralType" label="擔保品種類">
      </el-table-column>
      <el-table-column align="center" min-width="130" prop="collateralAmount" label="擔保品額度">
      </el-table-column>
      <el-table-column align="center" min-width="120" prop="paymentDeadline" label="款項繳費期限">
      </el-table-column>
    </el-table>
    <span>查詢帳戶月份：</span>
    <el-date-picker
      v-model="search_month"
      type="month"
      format="YYYY-MM"
      value-format="YYYY-MM"
      placeholder="請選擇查詢帳戶月份"
    />
    <div class="d-flex justify-content-between align-items-center my-3">
      <p class="m-0">{{ currentMonth }}月份交易明細</p>
      <button class="btn btn-warning" @click="exportExcel" :disabled="isLoadingFuel_record">
        匯出
      </button>
    </div>

    <div class="search d-flex mb-3 col-12 col-md-3">
      <el-input v-model="plate" placeholder="請輸入車牌搜尋" clearable></el-input>
    </div>

    <el-table
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
      <el-table-column align="center" min-width="110" prop="quantity" label="數量" />
      <el-table-column align="center" min-width="70" prop="unit_price" label="單價" />
      <el-table-column align="center" min-width="70" prop="discount" label="折讓" />
      <el-table-column align="center" min-width="110" prop="list_price_subtotal" label="牌價小計">
        <template #default="{ row }">
          <span>{{ formatNumber(row.list_price_subtotal) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" min-width="110" prop="discount_subtotal" label="折讓小計">
        <template #default="{ row }">
          <span>{{ formatNumber(row.discount_subtotal) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" min-width="110" prop="subtotal" label="售價小計">
        <template #default="{ row }">
          <span>{{ formatNumber(row.subtotal) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" min-width="110" prop="mileage" label="里程數">
        <template #default="{ row }">
          <span>{{ formatNumber(row.mileage) }}</span>
        </template>
      </el-table-column>
    </el-table>
    <el-table class="d-none" :data="filteredFuelData" id="fuel_data">
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
      <el-table-column align="center" min-width="110" prop="quantity" label="數量" />
      <el-table-column align="center" min-width="70" prop="unit_price" label="單價" />
      <el-table-column align="center" min-width="70" prop="discount" label="折讓" />
      <el-table-column align="center" min-width="110" prop="list_price_subtotal" label="牌價小計" />
      <el-table-column align="center" min-width="110" prop="discount_subtotal" label="折讓小計" />
      <el-table-column align="center" min-width="110" prop="subtotal" label="售價小計" />
      <el-table-column align="center" min-width="110" prop="mileage" label="里程數" />
    </el-table>
  </div>
</template>

<style scoped></style>
