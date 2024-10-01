<script setup>
import { ref, watch, computed, onMounted } from 'vue'

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const currentMonth = String(today.getMonth() + 1).padStart(2, '0')

const transfer_search_month = ref(`${currentYear}-${currentMonth}`)
const current_month = ref('')

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

function search_transfer_data() {
  console.log(transfer_search_month.value)
  updateCurrentMonth()
  transaction_time.value = new Intl.DateTimeFormat('en-CA', options).format(today).replace(',', '')
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

const transaction_time = ref('')

const current_month_balance = ref(-202212)
const last_month_balance = ref(-88103)
const current_month_remittance_amount = ref(1633000)
const current_month_fuel_total = ref(1747109)
const low_balance = ref(200000)

// 格式化數字
function formatNumber(value) {
  return value.toLocaleString('en-US')
}

const transfer_record = ref([
  {
    scheduled_date: '2024-08-07',
    remittance_amount: 343000,
    note: '刷卡'
  },
  {
    scheduled_date: '2024-08-05',
    remittance_amount: 800000,
    note: '匯款'
  },
  {
    scheduled_date: '2024-08-01',
    remittance_amount: 490000,
    note: '刷卡'
  },
  {
    scheduled_date: '2024-07-25',
    remittance_amount: 500000,
    note: '刷卡'
  },
  {
    scheduled_date: '2024-07-21',
    remittance_amount: 300000,
    note: '刷卡'
  },
  {
    scheduled_date: '2024-07-15',
    remittance_amount: 390000,
    note: '刷卡'
  },
  {
    scheduled_date: '2024-07-08',
    remittance_amount: 300000,
    note: '刷卡'
  },
  {
    scheduled_date: '2024-07-05',
    remittance_amount: 600000,
    note: '刷卡'
  },
  {
    scheduled_date: '2024-07-01',
    remittance_amount: 300000,
    note: '刷卡'
  }
])

// 分頁相關
const pageSize = ref(5) // 每頁顯示的筆數
const currentPage = ref(1) // 當前頁碼
const totalRecords = computed(() => transfer_record.value.length) // 總筆數
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return transfer_record.value.slice(start, end)
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
</script>

<template>
  <div class="container mt-5">
    <router-link to="/">
      <button class="btn btn-outline-warning mb-2">回首頁</button>
    </router-link>
    <p class="d-flex justify-content-between">
      <span class="fw-bold">匯款紀錄查詢</span>
      <span>結帳時間：{{ transaction_time }}</span>
    </p>
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
    <el-table :data="paginatedData" stripe>
      <el-table-column align="center" prop="scheduled_date" label="交易日" />
      <el-table-column align="center" prop="remittance_amount" label="匯款金額">
        <template #default="{ row }">
          <span>{{ formatNumber(row.remittance_amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="note" label="交易方式" />
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
