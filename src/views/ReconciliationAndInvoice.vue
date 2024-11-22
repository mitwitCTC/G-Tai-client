<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import router from '@/router'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
// 查詢對帳單總表及對帳單明細
import { useSearchAccountStore } from '@/stores/accountStore'
const searchAccountStore = useSearchAccountStore()
//JASON 2024.11.22 傳值
import { useRoute } from 'vue-router'
const route = useRoute()
const customerName = route.query.customerName
// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const current_month = String(today.getMonth() + 1).padStart(2, '0')

const search_month = ref(`${currentYear}-${current_month}`)
const currentMonth = ref('')

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
    // 月結方式的資訊
  } else if (transaction_mode.value == 2) {
    // 根據 subtotal_data 的資料生成表格標籤
    return [
      // 從 subtotal_data 中生成標籤，但排除 payment_deadline
      ...Object.keys(subtotal_data.value)
        .filter((key) => key !== 'payment_deadline')
        .map((key) => ({
          label: key,
          prop: key
        })),
      // 單獨新增款項繳費期限 label
      { label: '款項繳費期限', prop: 'payment_deadline' }
    ]
  }
  return []
})

const collateral_data = ref('')
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
      collateral_data.value = response.data.data[0].config_notes
      parseCollateralData(collateral_data.value)
      const remittance_date = response.data.data[0].remittance_date
      subtotal_data.value.payment_deadline = `每月${remittance_date}日前`
    } catch (error) {
      console.error(error)
    } finally {
      isLoadingSubtotal_data.value = false
    }
  }
}
// 調整擔保品資料格式
function parseCollateralData(data) {
  const parsedData = {}
  data.split(', ').forEach((item) => {
    const [collateral_item, valueWithNote] = item.split(':')
    const valueMatch = valueWithNote.match(/^(\d+)(?:\s*[([\s]?([^()[\]]+)[)\]]?)?$/)

    parsedData[collateral_item.trim()] = valueMatch
      ? `${formatNumber(Number(valueMatch[1]))} ${valueMatch[2] ? `(${valueMatch[2]})` : ''}`
      : valueWithNote.trim()
  })

  subtotal_data.value = parsedData
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
async function searchAccountGroup() {
  fetchSubtotalData()
  await getInvoiceList()
  try {
    const response = await apiClient.post('/main/accountGroup', {
      customerId: companyStore.company_info.customerId
    })
    reconciliationAndInvoice_list.value = response.data.data
  } catch (error) {
    console.error(error)
  }

  // 遍歷 reconciliationAndInvoice_list 和 invoice_list，進行 invoice_name 的比對並合併 invoice 資料
  reconciliationAndInvoice_list.value.forEach((item) => {
    const matchedInvoice = invoice_list.value.find(
      (invoiceItem) => invoiceItem.invoice_name === item.invoice_name
    )
    if (matchedInvoice) {
      item.invoice = matchedInvoice.invoice // 合併 invoice 資料
    }
  })
}

const invoice_list = ref([])
async function getInvoiceList() {
  invoice_list.value = []
}

watch(search_month, () => {
  searchAccountGroup()
})
onMounted(() => {
  searchAccountGroup()
})

// 跳轉到對應的頁面
const goToAccountStatement = (account_sortId) => {
  const searchAccount_info = {
    date: search_month.value,
    account_sortId: account_sortId,
    customerId: companyStore.company_info.customerId
  }
  searchAccountStore.setSearchAccount(searchAccount_info)
  router.push('/accountStatement')
}
//JASON 2024.11.22 acc_name:帳單名稱 invoice_name:抬頭
const goToAccountDetails = (account_sortId,acc_name,invoice_name) => {
  const searchAccount_info = {
    date: search_month.value,
    account_sortId: account_sortId,
    customerId: companyStore.company_info.customerId,
    acc_name:acc_name,
    invoice_name:invoice_name,
    customerName:customerName
  }
  searchAccountStore.setSearchAccount(searchAccount_info)
  router.push('/accountDetails')
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
            {{ scope.row[item.prop] }}
          </span>
        </template>
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
      @change="searchAccountGroup"
    />
    <p class="mt-4">{{ currentMonth }}月份對帳單&發票檔案列表</p>
    <el-table :data="reconciliationAndInvoice_list">
      <el-table-column
        prop="acc_name"
        label="帳單名稱"
        align="center"
        min-width="180"
      ></el-table-column>

      <el-table-column prop="account_sortId" label="帳單總表" align="center" min-width="120">
        <template #default="{ row }">
          <router-link to="accountStatement" @click="goToAccountStatement(row.account_sortId)">
            總表
          </router-link>
        </template>
      </el-table-column>

      <el-table-column prop="account_sortId" label="帳單明細" align="center" min-width="120">
        <template #default="{ row }">
          <router-link to="accountDetails" @click="goToAccountDetails(row.account_sortId,row.acc_name,row.invoice_name)">
            明細
          </router-link>
        </template>
      </el-table-column>

      <el-table-column prop="invoice.name" label="發票" align="center" min-width="120">
        <template #default="{ row }">
          <a :href="row.invoice?.downloadUrl">{{ row.invoice?.name }}</a>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped></style>
