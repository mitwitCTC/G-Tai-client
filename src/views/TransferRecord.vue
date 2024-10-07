<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import router from '@/router'

// 預設當月
const today = new Date()
const currentYear = today.getFullYear()
const current_month = ref(String(today.getMonth() + 1).padStart(2, '0'))
const transfer_search_month = ref(`${currentYear}-${current_month.value}`)

// 結帳時間
const transaction_time = ref('')
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

const subtotal_data = ref([])
// 小計表格 label
const subtotal_data_table_labels = computed(() => {
  // 儲值方式的資訊
  if (transaction_mode.value == 1) {
    // 計算前一個月份
    const previous_month = current_month.value == 1 ? 12 : current_month.value - 1
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
    // 月結方式的資訊
  } else if (transaction_mode.value == 2) {
    return [
      {
        label: '擔保品',
        prop: 'collateral_item'
      },
      {
        label: '擔保品價值',
        prop: 'collateral_value'
      }
    ]
  }
  return ''
})

// 取得匯款加油小計
function fetchSubtotalData() {
  if (transaction_mode.value == 1) {
    subtotal_data.value[0] = {
      current_month_balance: -202212,
      last_month_balance: -88103,
      current_month_remittance_amount: 1633000,
      current_month_fuel_total: 1747109
    }
  } else if (transaction_mode.value == 2) {
    subtotal_data.value[0] = {
      collateral_item: '現金',
      collateral_value: 50000
    }
  }
}

// 確認交易方式為儲值或月結 (1為儲值；2為月結)
const transaction_mode = ref('')
function checkTransaction_mode() {
  transaction_mode.value = sessionStorage.getItem('token')
}
onMounted(() => {
  checkTransaction_mode()
})

const low_balance = ref(200000)

const transfer_record = ref([])

// 搜尋匯款紀錄
function fetchTransferData() {
  console.log(transfer_search_month.value)
  updateCurrentMonth()
  transaction_time.value = new Intl.DateTimeFormat('en-CA', options).format(today).replace(',', '')
  fetchSubtotalData()
  transfer_record.value = [
    {
      scheduled_date: '2024-08-25',
      checkoutTime: '2024-08-28',
      remittance_amount: 500000,
      note: '刷卡'
    },
    {
      scheduled_date: '2024-08-21',
      checkoutTime: '2024-08-24',
      remittance_amount: 300000,
      note: '刷卡'
    },
    {
      scheduled_date: '2024-08-15',
      checkoutTime: '2024-08-18',
      remittance_amount: 390000,
      note: '刷卡'
    },
    {
      scheduled_date: '2024-08-08',
      checkoutTime: '2024-08-11',
      remittance_amount: 300000,
      note: '刷卡'
    },
    {
      scheduled_date: '2024-08-06',
      checkoutTime: '2024-08-09',
      remittance_amount: 600000,
      note: '刷卡'
    },
    {
      scheduled_date: '2024-08-07',
      checkoutTime: '2024-08-10',
      remittance_amount: 343000,
      note: '刷卡'
    },
    {
      scheduled_date: '2024-08-05',
      checkoutTime: '2024-08-08',
      remittance_amount: 800000,
      note: '匯款'
    },
    {
      scheduled_date: '2024-08-02',
      checkoutTime: '2024-08-05',
      remittance_amount: 490000,
      note: '刷卡'
    },
    {
      scheduled_date: '2024-08-01',
      checkoutTime: '2024-08-04',
      remittance_amount: 300000,
      note: '刷卡'
    }
  ]
}

function updateCurrentMonth() {
  if (transfer_search_month.value) {
    current_month.value = transfer_search_month.value.split('-')[1]
  } else {
    current_month.value = ''
  }
}

watch(transfer_search_month, () => {
  fetchTransferData()
})
onMounted(() => {
  fetchTransferData()
})

// 格式化數字
function formatNumber(value) {
  return value.toLocaleString('en-US')
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
        <button class="btn btn-outline-warning mb-2">回首頁</button>
      </router-link>
      <button class="btn btn-outline-warning" @click="logout">登出</button>
    </div>
    <p class="d-flex justify-content-between">
      <span class="fw-bold">匯款紀錄查詢</span>
      <span>結帳時間：{{ transaction_time }}</span>
    </p>
    <p>*以下匯款明細，會因匯款入帳作業有 2 - 3 工作天的差異</p>
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
          <span v-else>
            {{ formatNumber(scope.row[item.prop]) }}
          </span>
        </template>
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
    />
    <p class="my-3">安全值金額：{{ formatNumber(low_balance) }}</p>
    <el-table :data="transfer_record" stripe height="350">
      <el-table-column align="center" prop="scheduled_date" label="交易日" />
      <el-table-column align="center" prop="checkoutTime" label="結帳日" />
      <el-table-column align="center" prop="remittance_amount" label="匯款金額">
        <template #default="{ row }">
          <span>{{ formatNumber(row.remittance_amount) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" prop="note" label="交易方式" />
    </el-table>
  </div>
</template>

<style scoped></style>
