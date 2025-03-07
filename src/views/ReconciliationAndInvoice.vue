<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import router from '@/router'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
import { ElLoading } from 'element-plus'

const cus_code = companyStore.company_info.customerId
const customerName = companyStore.company_info.customerName
// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const current_month = String(today.getMonth() + 1).padStart(2, '0')

const search_month = ref(`${currentYear}-${current_month}`)
const currentMonth = ref('')

// API 根路由
import apiClient from '@/api' // 載入 apiClient
import { fetchWithRetry } from '@/services/fetchWithRetry'

// 確認交易方式為儲值或月結 (1為儲值；2為月結)
const transaction_mode = ref('')
function checkTransaction_mode() {
  transaction_mode.value = sessionStorage.getItem('token')
}
onMounted(() => {
  checkTransaction_mode()
})

const subtotal_data = ref({})
const isLoadingSubtotal_data = ref(false)
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
      const response = await fetchWithRetry('/main/monthlyBalance', {
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
        parsedData.forEach((item) => {
          collateral_data.value = []
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
onMounted(() => {
  fetchSubtotalData()
})
function updateCurrentMonth() {
  if (search_month.value) {
    currentMonth.value = search_month.value.split('-')[1]
  } else {
    currentMonth.value = ''
  }
}

// 格式化數字
function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : value
}

const reconciliationAndInvoice_list = ref([])
const loadingInstance = ref(null)
async function checkDataAvailability() {
  // 顯示 loading 遮罩
  loadingInstance.value = ElLoading.service({
    fullscreen: true,
    text: '載入中...',
    background: 'rgba(0, 0, 0, 0.5)'
  })
  try {
    const response = await fetchWithRetry('/main/dataJudgment', {
      date: search_month.value
    })
    if (response.data.returnCode == 0) {
      searchAccountGroup()
      getInvoiceList()
    } else {
      reconciliationAndInvoice_list.value = []
    }
  } catch (error) {
    console.error(error)
    alert('確認有無資料失敗，系統錯誤或網路不穩定！')
    reconciliationAndInvoice_list.value = []
  } finally {
    setTimeout(() => {
      loadingInstance.value.close()
    }, 1000)
  }
}
onMounted(() => {
  checkDataAvailability()
})

const isLoadingReconciliationAndInvoice_list = ref(false)
async function searchAccountGroup() {
  isLoadingReconciliationAndInvoice_list.value = true
  try {
    const response = await fetchWithRetry('/main/accountGroup', {
      date: search_month.value,
      customerId: cus_code
    })
    reconciliationAndInvoice_list.value = response.data.data
    mergeInvoiceData()
  } catch (error) {
    console.error(error)
    alert('載入對帳單組別資料失敗，系統錯誤或網路不穩定！')
    reconciliationAndInvoice_list.value = []
  } finally {
    isLoadingReconciliationAndInvoice_list.value = false
  }
}

const isLoadingInvoiceList = ref(false)
const invoiceList = ref([])
async function getInvoiceList() {
  isLoadingInvoiceList.value = true
  try {
    const response = await fetchWithRetry('/main/searchInvoice', {
      date: search_month.value,
      customerId: cus_code
    })
    
    if (response.data.returnCode == 0) {
      invoiceList.value = response.data.data
      mergeInvoiceData()
    } else {
      invoiceList.value = []
    }
  } catch (error) {
    console.error(error)
    alert('載入發票資料失敗，系統錯誤或網路不穩定！')
    invoiceList.value = []
  } finally {
    isLoadingInvoiceList.value = false
  }
}

function mergeInvoiceData() {
  // 檢查兩個列表是否已獲取
  if (!reconciliationAndInvoice_list.value.length || !invoiceList.value.length) return

  // 按照 account_sortId 合併發票資料
  reconciliationAndInvoice_list.value = reconciliationAndInvoice_list.value.map((item) => {
    // 找到所有與該帳單相關的發票
    const matchedInvoices = invoiceList.value.filter(
      (invoice) => invoice.account_sortId === item.account_sortId
    )
    
    // 將 matchedInvoices 的發票號碼收集到陣列中
    return {
      ...item,
      invoiceNums: matchedInvoices.map((invoice) => invoice.invoiceNum), // 收集發票號碼
    }
  })
}

watch(search_month, () => {
  updateCurrentMonth()
  fetchSubtotalData()
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
const isdownloadingAccountStatement = ref(false)
async function downloadAccountStatement(account_sortId, acc_name) {
  isdownloadingAccountStatement.value = true
  try {
    const response = await apiClient.post(
      '/main/downloadAccountStatement',
      {
        date: search_month.value,
        customerId: cus_code,
        account_sortId: account_sortId
      },
      { responseType: 'blob' } // 確保回傳型態是二進位
    )

    if (response.data.returnCode == -1 || response.data.returnCode == -2) {
      alert(response.data.message)
    }
    // 檢查回傳的資料
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('回傳資料非有效 PDF 格式')
    }
    const fileName = `${search_month.value}總表_${cus_code}_${acc_name}.pdf`

    downloadFile(new Blob([response.data]), fileName)
  } catch (error) {
    alert('下載失敗')
    console.error(error)
  } finally {
    isdownloadingAccountStatement.value = false
  }
}
const isdownloadingAccountDetails = ref(false)
async function downloadAccountDetails(account_sortId, acc_name) {
  isdownloadingAccountDetails.value = true
  try {
    const response = await apiClient.post(
      '/main/downloadAccountDetails',
      {
        date: search_month.value,
        customerId: cus_code,
        account_sortId: account_sortId
      },
      { responseType: 'blob' } // 確保回傳型態是二進位
    )

    if (response.data.returnCode == -1 || response.data.returnCode == -2) {
      alert(response.data.message)
    }
    // 檢查回傳的資料
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('回傳資料非有效 PDF 格式')
    }
    const fileName = `${search_month.value}明細_${cus_code}_${acc_name}.pdf`

    downloadFile(new Blob([response.data]), fileName)
  } catch (error) {
    alert('下載失敗')
    console.error(error)
  } finally {
    isdownloadingAccountDetails.value = false
  }
}

const thisMonth = ref('')
thisMonth.value = `${currentYear}-${current_month}` // 實際本月年-月
const isDownloadingInvoice = ref(false)
async function downloadInvoice(account_sortId, acc_name, invoiceNum) {  
  isDownloadingInvoice.value = true
  try {
    const response = await apiClient.post(
      '/main/downloadInvoice',
      {
        date: search_month.value,
        customerId: cus_code,
        invoiceNum: invoiceNum
      },
      { responseType: 'blob' } // 確保回傳型態是二進位
    )    

    if (response.data.returnCode == -1 || response.data.returnCode == -2) {
      alert(response.data.message)
    }
    // 檢查回傳的資料
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('回傳資料非有效 PDF 格式')
    }
    const fileName = `${search_month.value}發票_${cus_code}_${acc_name}.pdf`
    downloadFile(new Blob([response.data]), fileName)
  } catch (error) {
    alert('下載失敗')
    console.error(error)
  } finally {
    isDownloadingInvoice.value = false
  }
}
const downloadFile = (blob, fileName) => {
  // 動態建立 <a> 標籤
  const link = document.createElement('a')
  // 設置下載鏈接 blobURL
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  //添加到 DOM 並觸發點擊
  document.body.append(link)
  link.click()
  link.remove()
  // 釋放資源
  setTimeout(() => URL.revokeObjectURL(link.href), 7000)
}

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
    <p class="fw-bold">對帳單&發票查詢</p>

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
    <p>*本期匯入金額已先預扣本期製卡費用</p>
    查詢帳戶月份：
    <el-date-picker
      v-model="search_month"
      type="month"
      format="YYYY-MM"
      value-format="YYYY-MM"
      placeholder="請選擇查詢帳戶月份"
      @change="checkDataAvailability"
      :disabled="isLoadingSubtotal_data || isLoadingReconciliationAndInvoice_list || isLoadingInvoiceList"
    />
    <p class="mt-4">{{ currentMonth }}月份對帳單&發票檔案列表</p>
    <div
      element-loading-text="下載發票中..."
      :element-loading-spinner="svg"
      v-loading.fullscreen="isDownloadingInvoice"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    ></div>
    <div
      element-loading-text="下載對帳單總表中..."
      :element-loading-spinner="svg"
      v-loading.fullscreen="isdownloadingAccountStatement"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    ></div>
    <div
      element-loading-text="下載對帳單明細中..."
      :element-loading-spinner="svg"
      v-loading.fullscreen="isdownloadingAccountDetails"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    ></div>
    <div class="mb-3">
      <el-table
        :data="reconciliationAndInvoice_list"
        v-loading="isLoadingReconciliationAndInvoice_list || isLoadingInvoiceList"
      >
        <el-table-column
          prop="acc_name"
          label="帳單名稱"
          align="center"
          min-width="180"
        ></el-table-column>
  
        <el-table-column prop="account_sortId" label="帳單總表" align="center" min-width="120">
          <template #default="{ row }">
            <a
              class="pointer"
              @click="downloadAccountStatement(row.account_sortId, row.acc_name, row.invoice_name)"
            >
              <button class="btn btn-yellow">總表</button>
            </a>
          </template>
        </el-table-column>
  
        <el-table-column prop="account_sortId" label="帳單明細" align="center" min-width="120">
          <template #default="{ row }">
            <a
              class="pointer"
              @click="downloadAccountDetails(row.account_sortId, row.acc_name, row.invoice_name)"
            >
              <button class="btn btn-yellow">明細</button>
            </a>
          </template>
        </el-table-column>
  
        <el-table-column prop="發票" label="發票" align="center" min-width="140">
          <template #default="{ row }">
            <a v-if="row.invoiceNums && row.invoiceNums.length > 0" class="pointer">
              <div class="d-flex flex-column gap-1 align-items-center">
                <button class="btn btn-yellow" v-for="(invoiceNum, index) in row.invoiceNums"
                :key="index">
                  <span @click="downloadInvoice(row.account_sortId, row.acc_name, invoiceNum)">{{ invoiceNum }}</span>
                </button>
              </div>
            </a>
            <span v-else></span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.pointer {
  cursor: pointer;
}
</style>
