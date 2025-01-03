<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import router from '@/router'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
// 查詢對帳單總表及對帳單明細
import { useSearchAccountStore } from '@/stores/accountStore'
const searchAccountStore = useSearchAccountStore()
import { ElLoading } from 'element-plus'

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const current_month = String(today.getMonth() + 1).padStart(2, '0')

const search_month = ref(`${currentYear}-${current_month}`)
const currentMonth = ref('')
let config_notes

// API 根路由
import apiClient from '@/api' // 載入 apiClient

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
      const response = await apiClient.post('/main/monthlyBalance', {
        date: search_month.value,
        customerId: companyStore.company_info.customerId
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
        cus_code: companyStore.company_info.customerId
      })
      const rawData = response.data.data[0]
      const configNotes = rawData.config_notes || ''
      const remittanceDate = rawData.remittance_date
      console.log(configNotes)

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
    const response = await apiClient.post('/main/dataJudgment', {
      date: search_month.value
    })
    if (response.data.returnCode == 0) {
      searchAccountGroup()
    } else {
      reconciliationAndInvoice_list.value = []
    }
  } catch (error) {
    console.error(error)
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
    const response = await apiClient.post('/main/accountGroup', {
      date: search_month.value,
      customerId: companyStore.company_info.customerId
    })
    reconciliationAndInvoice_list.value = response.data.data
  } catch (error) {
    console.error(error)
  } finally {
    isLoadingReconciliationAndInvoice_list.value = false
  }
}

watch(search_month, () => {
  updateCurrentMonth()
})

// 跳轉到對應的頁面
const goToAccountStatement = (account_sortId, acc_name, invoice_name) => {
  const searchAccount_info = {
    date: search_month.value,
    account_sortId: account_sortId,
    customerId: companyStore.company_info.customerId,
    acc_name: acc_name,
    invoice_name: invoice_name,
    customerName: companyStore.company_info.customerName,
    transaction_mode: transaction_mode.value, //交易模式
    last_month_balance: subtotal_data.value.last_month_balance, //前期餘額
    current_month_remittance_amount: subtotal_data.value.current_month_remittance_amount, //本期匯入
    current_month_fuel_total: subtotal_data.value.current_month_fuel_total, //本期使用
    current_month_balance: subtotal_data.value.current_month_balance, //本期餘額
    payment_deadline: subtotal_data.value.payment_deadline, //月結繳款期限
    config_notes: config_notes //擔保品
  }
  searchAccountStore.setSearchAccount(searchAccount_info)
  router.push('/accountStatement')
}
const goToAccountDetails = (account_sortId, acc_name, invoice_name) => {
  const searchAccount_info = {
    date: search_month.value,
    account_sortId: account_sortId,
    customerId: companyStore.company_info.customerId,
    acc_name: acc_name,
    invoice_name: invoice_name,
    customerName: companyStore.company_info.customerName
  }
  searchAccountStore.setSearchAccount(searchAccount_info)
  router.push('/accountDetails')
}
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

const thisMonth = ref('')
thisMonth.value = `${currentYear}-${current_month}` // 實際本月年-月
const isDownloadingInvoice = ref(false)
async function downloadInvoice(account_sortId, acc_name) {
  isDownloadingInvoice.value = true
  try {
    const response = await apiClient.post(
      '/main/downloadInvoice',
      {
        date: search_month.value,
        customerId: companyStore.company_info.customerId,
        account_sortId: account_sortId
      },
      { responseType: 'blob' } // 確保回傳型態是二進位
    )
    // 檢查回傳的資料
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('回傳資料非有效 PDF 格式')
    }
    const fileName = `${search_month.value}發票_${companyStore.company_info.customerId}_${acc_name}.pdf`
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
    />
    <p class="mt-4">{{ currentMonth }}月份對帳單&發票檔案列表</p>
    <div
      element-loading-text="下載發票中..."
      :element-loading-spinner="svg"
      v-loading.fullscreen="isDownloadingInvoice"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    ></div>
    <el-table
      :data="reconciliationAndInvoice_list"
      v-loading="isLoadingReconciliationAndInvoice_list"
    >
      <el-table-column
        prop="acc_name"
        label="帳單名稱"
        align="center"
        min-width="180"
      ></el-table-column>

      <el-table-column prop="account_sortId" label="帳單總表" align="center" min-width="120">
        <template #default="{ row }">
          <router-link
            to="accountStatement"
            @click="goToAccountStatement(row.account_sortId, row.acc_name, row.invoice_name)"
          >
            總表
          </router-link>
        </template>
      </el-table-column>

      <el-table-column prop="account_sortId" label="帳單明細" align="center" min-width="120">
        <template #default="{ row }">
          <router-link
            to="accountDetails"
            @click="goToAccountDetails(row.account_sortId, row.acc_name, row.invoice_name)"
          >
            明細
          </router-link>
        </template>
      </el-table-column>

      <el-table-column prop="發票" label="發票" align="center" min-width="120">
        <template #default="{ row }" v-if="thisMonth != search_month">
          <a class="pointer" @click="downloadInvoice(row.account_sortId, row.acc_name)"> 發票 </a>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.pointer {
  cursor: pointer;
}
</style>
