<script setup>
import { ref, watch, onMounted } from 'vue'
import router from '@/router'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
// 查詢對帳單總表及對帳單明細
import { useSearchAccountStore } from '@/stores/accountStore'
const searchAccountStore = useSearchAccountStore()

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = String(today.getMonth() + 1).padStart(2, '0')

const search_month = ref(`${currentYear}-${currentMonth}`)
const current_month = ref('')

// API 根路由
import apiClient from '@/api' // 載入 apiClient
const reconciliationAndInvoice_list = ref([])
async function searchAccountGroup() {
  updateCurrentMonth()
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

function updateCurrentMonth() {
  if (search_month.value) {
    current_month.value = search_month.value.split('-')[1]
  } else {
    current_month.value = ''
  }
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
    search_month: search_month.value,
    account_sortId: account_sortId,
    customerId: companyStore.company_info.customerId
  }
  searchAccountStore.setSearchAccount(searchAccount_info)
  router.push('/accountStatement')
}
const goToAccountDetails = (account_sortId) => {
  const searchAccount_info = {
    search_month: search_month.value,
    account_sortId: account_sortId,
    customerId: companyStore.company_info.customerId
  }
  searchAccountStore.setSearchAccount(searchAccount_info)
  router.push('/accountDetails')
}

function logout() {
  sessionStorage.removeItem('token')
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
    查詢帳戶月份：
    <el-date-picker
      v-model="search_month"
      type="month"
      format="YYYY-MM"
      value-format="YYYY-MM"
      placeholder="請選擇查詢帳戶月份"
      @change="searchAccountGroup"
    />
    <p class="mt-4">{{ current_month }}月份對帳單&發票檔案列表</p>
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
          <router-link to="accountDetails" @click="goToAccountDetails(row.account_sortId)">
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
