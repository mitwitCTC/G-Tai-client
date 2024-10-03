<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const current_month = ref(String(today.getMonth() + 1).padStart(2, '0'))
const search_month = ref(`${currentYear}-${current_month.value}`)

// 最後更新時間
const update_time = ref('')
// 台北時間格式
const options = {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false
}

const subtotal_data = ref([
  {
    current_month_balance: 0,
    last_month_balance: 0,
    current_month_remittance_amount: 0,
    current_month_fuel_total: 0
  }
])
// 小計表格 label
const subtotal_data_table_labels = computed(() => {
  // 計算前一個月份
  const previous_month = current_month.value === 1 ? 12 : current_month.value - 1
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
})

const fuel_record = ref([])

// 搜尋加油紀錄
function fetchFuelData() {
  console.log(search_month.value)
  updateCurrentMonth()
  fetchSubtotalData()
  update_time.value = new Intl.DateTimeFormat('en-CA', options).format(today).replace(',', '')
  fuel_record.value = [
    {
      team: '泰樂-採訪車',
      transaction_date: '2024-07-28',
      transaction_time: '10:56:00',
      plate: 'AAA-1111',
      station: '蘆洲站',
      product_name: '92無鉛汽油',
      quantity: 48.9,
      unit_price: 31,
      discount: 1,
      list_price_subtotal: 1516,
      discount_subtotal: 49,
      subtotal: 1467,
      mileage: 195528,
      fuel_consumption: 0
    },
    {
      team: '泰樂-採訪車',
      transaction_date: '2024-07-27',
      transaction_time: '13:02:00',
      plate: 'AAA-2222',
      station: '中壢服務區站',
      product_name: '超級柴油',
      quantity: 169.81,
      unit_price: 27,
      discount: 1.3,
      list_price_subtotal: 4585,
      discount_subtotal: 221,
      subtotal: 4364,
      mileage: 209524,
      fuel_consumption: 0
    },
    {
      team: '泰樂-採訪車',
      transaction_date: '2024-07-27',
      transaction_time: '11:52:00',
      plate: 'AAA-3333',
      station: '重陽橋加油站',
      product_name: '超級柴油',
      quantity: 83.7,
      unit_price: 27,
      discount: 1.3,
      list_price_subtotal: 2260,
      discount_subtotal: 109,
      subtotal: 2151,
      mileage: 40707,
      fuel_consumption: 0
    },
    {
      team: '泰樂-工程車',
      transaction_date: '2024-07-31',
      transaction_time: '13:08:00',
      plate: '111-AA',
      station: '蘆洲三民路',
      product_name: '超級柴油',
      quantity: 64.07,
      unit_price: 27.3,
      discount: 1.3,
      list_price_subtotal: 1749,
      discount_subtotal: 83,
      subtotal: 1666,
      mileage: 349068,
      fuel_consumption: 0
    },
    {
      team: '泰樂-工程車',
      transaction_date: '2024-07-31',
      transaction_time: '02:34:00',
      plate: '222-AA',
      station: '蘆洲三民路',
      product_name: '超級柴油',
      quantity: 37.26,
      unit_price: 27.3,
      discount: 1.3,
      list_price_subtotal: 1017,
      discount_subtotal: 48,
      subtotal: 969,
      mileage: 332373,
      fuel_consumption: 0
    },
    {
      team: '泰樂-工程車',
      transaction_date: '2024-07-28',
      transaction_time: '02:42:00',
      plate: '333-AA',
      station: '蘆洲三民路',
      product_name: '超級柴油',
      quantity: 25.92,
      unit_price: 27,
      discount: 1.3,
      list_price_subtotal: 700,
      discount_subtotal: 34,
      subtotal: 666,
      mileage: 332226,
      fuel_consumption: 0
    },
    {
      team: '泰樂-工程車',
      transaction_date: '2024-07-30',
      transaction_time: '17:47:00',
      plate: '444-AA',
      station: '信誠',
      product_name: '超級柴油',
      quantity: 160.99,
      unit_price: 27.3,
      discount: 1.3,
      list_price_subtotal: 4395,
      discount_subtotal: 209,
      subtotal: 4186,
      mileage: 123456,
      fuel_consumption: 0
    }
  ]
}

// 取得匯款加油小計
function fetchSubtotalData() {
  subtotal_data.value[0] = {
    current_month_balance: -202212,
    last_month_balance: -88103,
    current_month_remittance_amount: 1633000,
    current_month_fuel_total: 1747109
  }
}

function updateCurrentMonth() {
  if (search_month.value) {
    current_month.value = search_month.value.split('-')[1]
  } else {
    current_month.value = ''
  }
}

watch(search_month, () => {
  fetchFuelData()
})
onMounted(() => {
  fetchFuelData()
})

// 格式化數字
function formatNumber(value) {
  return value.toLocaleString('en-US')
}

// 分頁相關
const pageSize = ref(5) // 每頁顯示的筆數
const currentPage = ref(1) // 當前頁碼
const totalRecords = computed(() => fuel_record.value.length) // 總筆數
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return fuel_record.value.slice(start, end)
})

// 改變每頁顯示的筆數
function handleSizeChange(size) {
  pageSize.value = size
  currentPage.value = 1 // 重置到第一頁
}

// 改變當前頁碼
function handleCurrentChange(page) {
  currentPage.value = page
}

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
    '數量(公升)': 'quantity',
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
    let maxWidth = 14
    for (let R = range.s.r; R <= range.e.r; ++R) {
      let cell_address = { c: C, r: R }
      let cell_ref = XLSX.utils.encode_cell(cell_address)
      let cell = ws[cell_ref]
      if (!cell || !cell.v) continue
      let cellValue = cell.v.toString()
      maxWidth = Math.max(maxWidth, cellValue.length)
    }
    colWidths.push({ wch: maxWidth })
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
</script>

<template>
  <div class="container mt-5">
    <router-link to="/">
      <button class="btn btn-outline-warning mb-2">回首頁</button>
    </router-link>
    <p class="d-flex justify-content-between">
      <span class="fw-bold">加油紀錄</span>
      <span>最後資料更新時間：{{ update_time }}</span>
    </p>
    <p>*以下交易明細，會因匯款入帳作業有 2 - 3 工作天的差異</p>
    <el-table class="mb-3" border :data="subtotal_data">
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
          <span v-else>{{ scope.row[item.prop] }}</span>
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
    <el-table :data="paginatedData" stripe height="350">
      <el-table-column align="center" min-width="110" prop="team" label="使用單位(對帳單組別)" />
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
      <el-table-column align="center" min-width="110" prop="quantity" label="數量(公升)" />
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
    <el-table class="d-none" :data="fuel_record" id="fuel_data">
      <el-table-column align="center" min-width="110" prop="team" label="使用單位(對帳單組別)" />
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
      <el-table-column align="center" min-width="110" prop="quantity" label="數量(公升)" />
      <el-table-column align="center" min-width="70" prop="unit_price" label="單價" />
      <el-table-column align="center" min-width="70" prop="discount" label="折讓" />
      <el-table-column align="center" min-width="110" prop="list_price_subtotal" label="牌價小計" />
      <el-table-column align="center" min-width="110" prop="discount_subtotal" label="折讓小計" />
      <el-table-column align="center" min-width="110" prop="subtotal" label="售價小計" />
      <el-table-column align="center" min-width="110" prop="mileage" label="里程數" />
      <el-table-column align="center" min-width="110" prop="fuel_consumption" label="油耗" />
    </el-table>

    <p>
      顯示第 {{ (currentPage - 1) * pageSize + 1 }} 項 到 第
      {{ Math.min(currentPage * pageSize, totalRecords) }} 項 (共 {{ totalRecords }} 項)
    </p>
    <el-pagination
      background
      layout="sizes, prev, pager, next"
      :page-sizes="[3, 5, 10]"
      :page-size="pageSize"
      :show-sizes="false"
      :total="totalRecords"
      :current-page="currentPage"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    >
    </el-pagination>
  </div>
</template>

<style scoped></style>
