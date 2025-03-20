<script setup>
import TheLayout from '@/components/TheLayout.vue'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
import { ref, watch, computed, onMounted } from 'vue'
const cus_code = companyStore.company_info.customerId

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const current_month = ref(String(today.getMonth() + 1).padStart(2, '0'))
const transfer_search_month = ref(`${currentYear}-${current_month.value}`)
const currentMonth = ref('')

import apiClient from '@/api' // 載入 apiClient
import { fetchWithRetry } from '@/services/fetchWithRetry'
// 結帳時間
const transaction_time = ref('')
// 取得結帳時間
async function fetchTransactionTime() {
  try {
    const response = await fetchWithRetry('/main/lastUpdateTime', {
      customerId: cus_code
    })
    transaction_time.value = response.data.data
  } catch (error) {
    console.error(error)
    alert('載入時間失敗，系統錯誤或網路不穩定！')
  }
}
onMounted(() => {
  fetchTransactionTime()
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
const isLoadingTransfer_record = ref(false)

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

function updateCurrentMonth() {
  if (transfer_search_month.value) {
    currentMonth.value = transfer_search_month.value.split('-')[1]
  } else {
    currentMonth.value = ''
  }
}

const collateral_data = ref([])
// 取得匯款加油小計
async function fetchSubtotalData() {
  updateCurrentMonth()
  if (transaction_mode.value == 1) {
    isLoadingSubtotal_data.value = true
    try {
      const response = await fetchWithRetry('/main/monthlyBalance', {
        date: transfer_search_month.value,
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
      alert('載入小計資料失敗，系統錯誤或網路不穩定！')
      subtotal_data.value = {}
    } finally {
      isLoadingSubtotal_data.value = false
    }
  } else if (transaction_mode.value == 2) {
    isLoadingSubtotal_data.value = true
    try {
      const response = await fetchWithRetry('/main/collateralInfo', {
        cus_code: cus_code
      })
      const rawData = response.data.data[0]
      const configNotes = rawData.config_notes || ''
      const remittanceDate = rawData.remittance_date

      const parsedData = parseCollateralData(configNotes)
      const paymentDeadline = remittanceDate ? `每月${remittanceDate}日前` : ''

      // 如果 parsedData 為空，僅添加款項繳費期限
      if (parsedData.length === 0) {
        collateral_data.value = []
        collateral_data.value.push({
          collateralType: '',
          collateralAmount: '',
          paymentDeadline
        })
      } else {
        collateral_data.value = []
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
      alert('載入擔保品資料失敗，系統錯誤或網路不穩定！')
      collateral_data.value = []
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

// 確認交易方式為儲值或月結 (1為儲值；2為月結)
const transaction_mode = ref('')
function checkTransaction_mode() {
  transaction_mode.value = sessionStorage.getItem('token')
}
onMounted(() => {
  checkTransaction_mode()
})

const transfer_record = ref([])

// 搜尋匯款紀錄
async function fetchTransferData() {
  fetchSubtotalData()
  isLoadingTransfer_record.value = true
  try {
    const response = await fetchWithRetry('/main/remittanceRecord', {
      date: transfer_search_month.value,
      customerId: cus_code
    })
    transfer_record.value = response.data.data
    transfer_record.value = response.data.data.map((item) => ({
      scheduled_date: convertToGregorianDate(Number(item.account_date)), // 轉換日期格式
      checkoutTime: item.checkoutTime === '0' ? '' : item.checkoutTime.replace(/\//g, '-'), // 轉換日期格式
      remittance_amount: formatNumber(Number(item.amount)), // 格式化數字
      note: tradingModelMap[item.trading_model] || item.trading_model // 取得對應的 trading_model_des，若無則顯示原始 trading_model
    }))
  } catch (error) {
    console.error(error)
    alert('載入匯款紀錄資料失敗，系統錯誤或網路不穩定！')
    transfer_record.value = []
  } finally {
    isLoadingTransfer_record.value = false
  }
}

// 將民國日期轉換為西元日期
function convertToGregorianDate(rocDate) {
  const year = Math.floor(rocDate / 10000)
  const month = Math.floor((rocDate % 10000) / 100)
  const day = rocDate % 100
  const gregorianYear = year + 1911
  return `${gregorianYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
// 比對入帳模式(交易模式)
const trading_model_list = ref([])
async function getTrading_model_list() {
  try {
    const response = await apiClient.get('/main/tradingModel')
    trading_model_list.value = response.data.data
  } catch (error) {
    console.error(error)
    alert('確認交易模式失敗，系統錯誤或網路不穩定！')
  }
}
onMounted(() => {
  getTrading_model_list()
})

const tradingModelMap = computed(() => {
  return trading_model_list.value.reduce((acc, item) => {
    acc[item.trading_model_code] = item.trading_model_des
    return acc
  }, {})
})

watch(transfer_search_month, () => {
  fetchTransferData()
  fetchSubtotalData()
})
onMounted(() => {
  fetchTransferData()
})

// 格式化數字
function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : value
}
</script>

<template>
  <TheLayout>
    <p class="d-flex justify-content-between">
      <span class="fw-bold">匯款紀錄查詢</span>
      <span v-if="transaction_time != '無最後更新時間'">結帳時間：{{ transaction_time }}</span>
    </p>
    <p>*以下匯款明細，會因匯款入帳作業有 2 - 3 工作天的差異</p>
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
    查詢帳戶月份：
    <el-date-picker
      v-model="transfer_search_month"
      type="month"
      format="YYYY-MM"
      value-format="YYYY-MM"
      placeholder="請選擇查詢帳戶月份"
      @change="fetchTransferData"
      :disabled="isLoadingSubtotal_data || isLoadingTransfer_record"
    />
    <p class="my-3"></p>
    <el-table
      class="mb-3"
      :data="transfer_record"
      stripe
      height="350"
      v-loading="isLoadingTransfer_record"
      element-loading-text="資料載入中..."
      :element-loading-spinner="svg"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    >
      <el-table-column align="center" prop="scheduled_date" label="交易日" />
      <el-table-column align="center" prop="checkoutTime" label="結帳日" />
      <el-table-column align="center" prop="remittance_amount" label="匯款金額">
        <template #default="{ row }">
          <span>{{ formatNumber(row.remittance_amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="note" label="交易方式">
        <template #default="{ row }">
          <span>{{ tradingModelMap[row.note] }}</span>
        </template>
      </el-table-column>
    </el-table>
  </TheLayout>
</template>

<style scoped></style>
