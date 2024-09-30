<script setup>
import { ref, watch, computed, onMounted } from 'vue'

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = String(today.getMonth() + 1).padStart(2, '0')

const transfer_search_month = ref(`${currentYear}-${currentMonth}`)
const current_month = ref('')

function search_transfer_data() {
  console.log(transfer_search_month.value)
  updateCurrentMonth()
}

function updateCurrentMonth() {
  if (transfer_search_month.value) {
    current_month.value = transfer_search_month.value.split('-')[1]
  } else {
    current_month.value = ''
  }
}

watch(transfer_search_month, () => {
  search_transfer_data()
})
// 計算前一個月份
const previous_month = computed(() => {
  const month = parseInt(current_month.value)
  return month === 1 ? 12 : month - 1
})
onMounted(() => {
  search_transfer_data()
})

const current_month_balance = ref(-202212)
const last_month_balance = ref(-88103)
const current_month_remittance_amount = ref(1633000)
const current_month_fuel_total = ref(1747109)
const low_balance = ref(200000)

// 格式化數字
function formatNumber(value) {
  return value.toLocaleString('en-US')
}
</script>

<template>
  <div class="container mt-5">
    <router-link to="/">
      <button class="btn btn-outline-warning mb-2">回首頁</button>
    </router-link>
    <p class="fw-bold">匯款紀錄查詢</p>
    <p>*以下匯款明細，會因匯款入帳作業有 2 - 3 工作天的差異</p>
    查詢帳戶月份：
    <el-date-picker
      v-model="transfer_search_month"
      type="month"
      format="YYYY-MM"
      value-format="YYYY-MM"
      placeholder="請選擇查詢帳戶月份"
      @change="search_transfer_data"
    />
    <p v-if="current_month">
      <br />
      <span>{{ current_month }}月份餘額：</span>
      <span class="text-primary fw-bold">
        {{ formatNumber(current_month_balance) }}
      </span>
      <span>=</span>
      <span>{{ previous_month }}月份餘額</span>
      <span class="text-primary fw-bold">
        {{ formatNumber(last_month_balance) }}
      </span>
      <span>+</span>
      <span>{{ current_month }}月份匯款</span>
      <span class="text-primary fw-bold">
        {{ formatNumber(current_month_remittance_amount) }}
      </span>
      <span>-</span>
      <span>{{ current_month }}月份加油小計</span>
      <span class="text-primary fw-bold">
        {{ formatNumber(current_month_fuel_total) }}
      </span>
    </p>
    <p>安全值金額：{{ formatNumber(low_balance) }}</p>
  </div>
</template>

<style scoped></style>
