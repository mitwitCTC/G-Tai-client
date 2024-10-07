<script setup>
import { ref, watch, onMounted } from 'vue'
import router from '@/router'

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = String(today.getMonth() + 1).padStart(2, '0')

const search_month = ref(`${currentYear}-${currentMonth}`)
const current_month = ref('')
const reconciliation_list = ref([])
const invoice_list = ref([])
function search() {
  console.log(search_month.value)
  updateCurrentMonth()
  reconciliation_list.value = [
    {
      name: '對帳單202407-0028日星交通事業有限公司.pdf',
      url: 'https://ct9967.com.tw/oil/tmp_PDF/%E5%B0%8D%E5%B8%B3%E5%96%AE202407-0028%E6%97%A5%E6%98%9F%E4%BA%A4%E9%80%9A%E4%BA%8B%E6%A5%AD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8.pdf'
    },
    {
      name: '對帳單202407-0027日星交通事業有限公司.pdf',
      url: 'https://ct9967.com.tw/oil/tmp_PDF/%E5%B0%8D%E5%B8%B3%E5%96%AE202407-0027%E6%97%A5%E6%98%9F%E4%BA%A4%E9%80%9A%E4%BA%8B%E6%A5%AD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8.pdf'
    },
    {
      name: '對帳單202407-0026日星交通事業有限公司.pdf',
      url: 'https://ct9967.com.tw/oil/tmp_PDF/%E5%B0%8D%E5%B8%B3%E5%96%AE202407-0026%E6%97%A5%E6%98%9F%E4%BA%A4%E9%80%9A%E4%BA%8B%E6%A5%AD%E6%9C%89%E9%99%90%E5%85%AC%E5%8F%B8.pdf'
    }
  ]
  invoice_list.value = [
    {
      name: '11308_DK6162226811308.pdf',
      url: 'https://ct9967.com.tw/oil/tmp_PDF/11308_DK6162226811308.pdf'
    },
    {
      name: '11308_DK6162226911308.pdf',
      url: 'https://ct9967.com.tw/oil/tmp_PDF/11308_DK6162226911308.pdf'
    },
    {
      name: '11308_DK6162226711308.pdf',
      url: 'https://ct9967.com.tw/oil/tmp_PDF/11308_DK6162226711308.pdf'
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
  search()
})
onMounted(() => {
  search()
})

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
      @change="search"
    />
    <p class="mt-4">{{ current_month }}月份對帳單&發票檔案列表</p>
    <p>對帳單：</p>
    <ul>
      <li v-for="(item, index) in reconciliation_list" :key="index">
        <a :href="item.url">{{ item.name }}</a>
      </li>
    </ul>
    <p>發票：</p>
    <ul>
      <li v-for="(item, index) in invoice_list" :key="index">
        <a :href="item.url">{{ item.name }}</a>
      </li>
    </ul>
  </div>
</template>

<style scoped></style>
