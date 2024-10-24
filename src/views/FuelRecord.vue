<script setup>
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
import { ref, watch, computed, onMounted } from 'vue'
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
import router from '@/router'

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const current_month = ref(String(today.getMonth() + 1).padStart(2, '0'))
const search_month = ref(`${currentYear}-${current_month.value}`)

// API 根路由
import apiClient from '@/api' // 載入 apiClient
// 最後更新時間
const update_time = ref('')
// 取得最後更新時間
async function fetchUpdateTime() {
  try {
    const response = await apiClient.post('/main/lastUpdateTime', {
      customerId: companyStore.company_info.customerId
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

const subtotal_data = ref({
  current_month_balance: 0,
  last_month_balance: 0,
  current_month_remittance_amount: 0,
  current_month_fuel_total: 0
})
// 小計表格 label
const subtotal_data_table_labels = computed(() => {
  // 儲值方式的資訊
  if (transaction_mode.value == 1) {
    // 計算前一個月份
    const previous_month = current_month.value == 1 ? 12 : current_month.value - 1
    return [
      {
        label: `${current_month.value}月份餘額`,
        prop: 'current_month_balance'
      },
      {
        label: '',
        prop: 'equal_sign'
      },
      {
        label: `${previous_month}月份餘額`,
        prop: 'last_month_balance'
      },
      {
        label: '',
        prop: 'plus_sign'
      },
      {
        label: `${current_month.value}月份匯款`,
        prop: 'current_month_remittance_amount'
      },
      {
        label: '',
        prop: 'minus_sign'
      },
      {
        label: `${current_month.value}月份加油小計`,
        prop: 'current_month_fuel_total'
      }
    ]
    // 月結方式的資訊
  } else if (transaction_mode.value == 2) {
    return [
      {
        label: '擔保品種類',
        prop: 'collateral_item'
      },
      {
        label: '擔保品額度',
        prop: 'collateral_value'
      },
      {
        label: '款項繳費期限',
        prop: 'payment_deadline'
      }
    ]
  }
  return ''
})

const fuel_record = ref([])

// 搜尋加油紀錄
async function fetchFuelData() {
  fetchSubtotalData()
  fetchUpdateTime()
  isLoadingFuel_record.value = true
  try {
    const response = await apiClient.post('/main/balanceInquiry', {
      date: search_month.value,
      customerId: companyStore.company_info.customerId
    })
    fuel_record.value = response.data.data.map((item) => ({
      team: `${item.acc_name}-${item.vehicle_type || ''}`,
      transaction_date: item.trade_time.split(' ')[0].replace(/\//g, '-'),
      transaction_time: item.trade_time.split(' ')[1],
      plate: item.license_plate,
      station: item.station_name,
      product_name: item.fuel_type,
      quantity: Number(item.fuel_volume) || 0,
      unit_price: Number(item.reference_price) || 0,
      discount: Number(item.discount) || 0,
      list_price_subtotal: Number(item.reference_amount) || 0,
      discount_subtotal: Number(item.discount_amount) || 0,
      subtotal: Number(item.salesAmount) || 0,
      mileage: Number(item.mileage) || 0,
      fuel_consumption: Number(item.fuel_consumption) || 0
    }))
  } catch (error) {
    console.error(error)
  } finally {
    isLoadingFuel_record.value = false
  }
}

// 取得匯款加油小計
async function fetchSubtotalData() {
  if (transaction_mode.value == 1) {
    isLoadingSubtotal_data.value = true
    try {
      const response = await apiClient.post('/main/monthlyBalance', {
        date: `${currentYear}-${current_month.value}`,
        customerId: companyStore.company_info.customerId
      })
      subtotal_data.value.current_month_balance = Number(response.data.data[0].thisMonthOverage)
      subtotal_data.value.last_month_balance = Number(response.data.data[0].overage)
      subtotal_data.value.current_month_remittance_amount = Number(
        response.data.data[0].creditAmount
      )
      subtotal_data.value.current_month_fuel_total = Number(response.data.data[0].salesAmount)
    } catch (error) {
      console.error(error)
    } finally {
      isLoadingSubtotal_data.value = false
    }
  } else if (transaction_mode.value == 2) {
    subtotal_data.value = {
      collateral_item: '現金',
      collateral_value: 50000,
      payment_deadline: '每月15日前'
    }
  }
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
    油耗: 'fuel_consumption'
  }

  const numberFields = [
    'quantity',
    'unit_price',
    'discount',
    'list_price_subtotal',
    'discount_subtotal',
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
      `${current_month.value}月加油交易明細.xlsx`
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
    <p class="text-end" v-if="update_time != '無最後更新時間'">
      最後資料更新時間：{{ update_time }}
    </p>
    <el-table class="mb-3" border :data="[subtotal_data]" v-loading="isLoadingSubtotal_data">
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
            {{ formatNumber(scope.row[item.prop]) }}
          </span>
        </template>
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
      <p class="m-0">{{ current_month }}月份交易明細</p>
      <button class="btn btn-warning" @click="exportExcel">匯出</button>
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
      <el-table-column align="center" min-width="110" prop="fuel_consumption" label="油耗">
        <template #default="{ row }">
          <span>{{ formatNumber(row.fuel_consumption) }}</span>
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
      <el-table-column align="center" min-width="110" prop="fuel_consumption" label="油耗" />
    </el-table>
  </div>
</template>

<style scoped></style>
