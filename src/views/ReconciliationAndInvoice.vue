<script setup>
import { ref, watch, onMounted } from 'vue'
import router from '@/router'

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = String(today.getMonth() + 1).padStart(2, '0')

const search_month = ref(`${currentYear}-${currentMonth}`)
const current_month = ref('')

const reconciliationAndInvoice_list = ref([])
function searchAccountGroup() {
  console.log(search_month.value)
  updateCurrentMonth()
  reconciliationAndInvoice_list.value = [
    {
      acc_name: '永青遊覽有限公司', // 開立發票名稱
      account_sortId: '854',
      invoice: {
        name: 'DK61622268',
        downloadUrl: 'https://ct9967.com.tw/oil/tmp_PDF/11308_DK6162226811308.pdf'
      }
    },
    {
      acc_name: '日星交通事業有限公司',
      account_sortId: '853',
      invoice: {
        name: 'DK61622267',
        downloadUrl: 'https://ct9967.com.tw/oil/tmp_PDF/11308_DK6162226711308.pdf'
      }
    }
  ]
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
  console.log(account_sortId)
  router.push('/accountStatement')
}
const goToAccountDetails = (account_sortId) => {
  console.log(account_sortId)
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
            {{ row.account_sortId }} <br />
            總表
          </router-link>
        </template>
      </el-table-column>

      <el-table-column prop="account_sortId" label="帳單明細" align="center" min-width="120">
        <template #default="{ row }">
          <router-link to="accountDetails" @click="goToAccountDetails(row.account_sortId)">
            {{ row.account_sortId }} <br />
            明細
          </router-link>
        </template>
      </el-table-column>

      <el-table-column prop="invoice.name" label="發票" align="center" min-width="120">
        <template #default="{ row }">
          <a :href="row.invoice.downloadUrl">{{ row.invoice.name }}</a>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped></style>
