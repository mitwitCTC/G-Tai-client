<script setup>
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
import { ref, onMounted } from 'vue'

// API 根路由
import apiClient from '@/api' // 載入 apiClient
// 格式化數字
function formatNumber(value) {
  return value.toLocaleString('en-US')
}
const company_info = ref({})
async function getCompany_info() {
  company_info.value = {
    year: '2024',
    month: '07',
    name: '日星交通事業有限公司',
    vat_number: '04995964', // 開立發票統編
    company_title: '永青遊覽有限公司', // 開立發票名稱
    acc_type: 'A', // 對帳單組別
    acc_No: '202407-0027' // 對帳單號
  }
}
onMounted(() => {
  getCompany_info()
})

// 確認交易方式為儲值或月結 (1為儲值；2為月結)
const transaction_mode = ref('')
function checkTransaction_mode() {
  transaction_mode.value = sessionStorage.getItem('token')
}
onMounted(() => {
  checkTransaction_mode()
})

const subtotal_data = ref({
  current_month_balance: 0,
  last_month_balance: 0,
  current_month_remittance_amount: 0,
  current_month_fuel_total: 0
})
// 取得匯款加油小計
async function fetchSubtotalData() {
  if (transaction_mode.value == 1) {
    try {
      const response = await apiClient.post('/main/monthlyBalance', {
        customerId: companyStore.company_info.customerId
      })
      subtotal_data.value.date = `${company_info.value.year - 1911}/${company_info.value.month}`
      subtotal_data.value.current_month_balance = Number(response.data.data[0].thisMonthOverage)
      subtotal_data.value.last_month_balance = Number(response.data.data[0].overage)
      subtotal_data.value.current_month_remittance_amount = Number(
        response.data.data[0].creditAmount
      )
      subtotal_data.value.current_month_fuel_total = Number(response.data.data[0].salesAmount)
    } catch (error) {
      console.error(error)
    }
  } else if (transaction_mode.value == 2) {
    subtotal_data.value[0] = {
      collateral_item: '現金',
      collateral_value: 50000,
      payment_deadline: '每月15日前'
    }
  }
}
onMounted(() => {
  fetchSubtotalData()
})

const car_summary_data = ref([])
// 取得車輛加油概要資料
async function fetchCarSummaryData() {
  car_summary_data.value = [
    {
      year_month: '113/07', //年月
      plate: '366-ZZ', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 2287.91, // 公升數合計
      list_price_subtotal: 61012, // 牌價合計
      subtotal: 57579, // 售價合計
      mileage: 6301, // 總里程數
      fuel_consumption: 3.19 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: '843-TT', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 1868.6, // 公升數合計
      list_price_subtotal: 49783, // 牌價合計
      subtotal: 46981, // 售價合計
      mileage: 5036, // 總里程數
      fuel_consumption: 3.13 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: '845-TT', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 934.85, // 公升數合計
      list_price_subtotal: 24767, // 牌價合計
      subtotal: 23365, // 售價合計
      mileage: 2217, // 總里程數
      fuel_consumption: 2.58 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: 'KAC-0657', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 1309.18, // 公升數合計
      list_price_subtotal: 35050, // 牌價合計
      subtotal: 33087, // 售價合計
      mileage: 2647, // 總里程數
      fuel_consumption: 2.51 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: 'KAC-3719', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 545.65, // 公升數合計
      list_price_subtotal: 14547, // 牌價合計
      subtotal: 13729, // 售價合計
      mileage: 1791, // 總里程數
      fuel_consumption: 3.78 // 油耗
    },
    {
      year_month: '113/07', //年月
      plate: 'KAC-3719', // 車牌號碼
      product_name: '0006 超級柴油', // 品項(油品)
      quantity: 545.65, // 公升數合計
      list_price_subtotal: 14547, // 牌價合計
      subtotal: 13729, // 售價合計
      mileage: 1791, // 總里程數
      fuel_consumption: 3.78 // 油耗
    }
  ]
}
onMounted(() => {
  fetchCarSummaryData()
})

const car_fuel_details = ref([])
// 分組數據的變量
const groupedData = ref([])

// 初始化時獲取數據
async function fetchCarFuelDetails() {
  car_fuel_details.value = [
    {
      plate: '366-ZZ',
      transaction_date_time: '2024/07/05 11:22',
      station: 'HHA69 北新加油站',
      product_name: '0006 超級柴油',
      unit_price: 26.4,
      quantity: 204.25,
      discount: 1.5,
      list_price_subtotal: 5392,
      subtotal: 5086,
      mileage: 586657
    },
    {
      plate: '366-ZZ',
      transaction_date_time: '2024/07/07 04:44',
      station: 'TTD27 金滿溢',
      product_name: '0006 超級柴油',
      unit_price: 26.4,
      quantity: 184.39,
      discount: 1.5,
      list_price_subtotal: 4868,
      subtotal: 4591,
      mileage: 587203
    },
    {
      plate: '366-ZZ',
      transaction_date_time: '2024/07/07 221:24',
      station: 'gga04 車亭三義',
      product_name: '0006 超級柴油',
      unit_price: 26.4,
      quantity: 227.14,
      discount: 1.5,
      list_price_subtotal: 5996,
      subtotal: 5655,
      mileage: 587900
    },
    {
      plate: '843-TT',
      transaction_date_time: '2024/07/02 11:41',
      station: 'YYE47 龍潭交流道',
      product_name: '0006 超級柴油',
      unit_price: 26.4,
      quantity: 135.45,
      discount: 1.5,
      list_price_subtotal: 3576,
      subtotal: 3373,
      mileage: 641837
    }
  ]

  // 分組數據並計算小計
  groupDataByPlateAndProduct()
}

// 根據車牌和油品分組，並插入小計行
function groupDataByPlateAndProduct() {
  const grouped = []
  const plates = [...new Set(car_fuel_details.value.map((item) => item.plate))]

  plates.forEach((plate) => {
    const filteredData = car_fuel_details.value.filter((item) => item.plate === plate)
    const productGroups = groupByProduct(filteredData)

    // 將數據插入
    productGroups.forEach((group) => {
      grouped.push(...group.data)

      // 計算小計
      const subtotal = group.data.reduce(
        (acc, item) => ({
          product_name: item.product_name, // 顯示油品名稱
          quantity: acc.quantity + item.quantity,
          list_price_subtotal: acc.list_price_subtotal + item.list_price_subtotal,
          subtotal: acc.subtotal + item.subtotal,
          mileage: item.mileage // 最後一個里程數
        }),
        {
          product_name: '',
          quantity: 0,
          list_price_subtotal: 0,
          subtotal: 0,
          mileage: 0
        }
      )

      // 插入小計行
      grouped.push({
        plate: '小計',
        transaction_date_time: '',
        station: '',
        product_name: subtotal.product_name, // 油品名稱
        unit_price: '', // 不顯示單價
        quantity: subtotal.quantity, // 顯示油量的總計
        discount: '', // 折讓不顯示
        list_price_subtotal: subtotal.list_price_subtotal, // 牌價金額總計
        subtotal: subtotal.subtotal, // 售價小計總計
        mileage: subtotal.mileage, // 最後一筆里程數
        isSummary: true // 標記為小計行
      })
    })
  })

  groupedData.value = grouped
}

// 根據油品名稱分組
function groupByProduct(data) {
  const products = [...new Set(data.map((item) => item.product_name))]
  return products.map((product) => ({
    product_name: product,
    data: data.filter((item) => item.product_name === product)
  }))
}
// 動態合併小計行的欄位
function mergeCells({ row, columnIndex }) {
  if (row.isSummary) {
    if (columnIndex === 0) {
      // 合併前 3 個欄位
      return { rowspan: 1, colspan: 3 }
    }
    if (columnIndex === 1 || columnIndex === 2) {
      // 前三個欄位合併時，這些欄位不顯示
      return { rowspan: 0, colspan: 0 }
    }
  }
  return { rowspan: 1, colspan: 1 }
}

onMounted(() => {
  fetchCarFuelDetails()
})
</script>
<template>
  <div class="container mt-5">
    <h3 class="text-center">鉅泰創新股份有限公司</h3>
    <p class="text-center">{{ company_info.year }} 年 {{ company_info.month }} 月對帳單</p>
    <div class="company-info">
      <p class="d-flex justify-content-between flex-md-row flex-column-reverse">
        <span
          >客戶名稱：
          <span>{{ company_info.name }}</span>
        </span>
        <span
          >對帳單號：
          <span>{{ company_info.acc_No }}</span>
        </span>
      </p>
      <p>
        開立發票統編：<span>{{ company_info.vat_number }}</span>
      </p>
      <p>
        開立發票名稱：<span>{{ company_info.company_title }}</span>
      </p>
      <p>
        對帳單組別：<span>{{ company_info.acc_type }}</span>
      </p>
    </div>
    <div class="subtotal-data">
      <el-table border :data="[subtotal_data]">
        <el-table-column align="center" min-width="80" prop="date" label="年月" />
        <el-table-column align="center" min-width="100" label="前期餘額">
          <template #default="{ row }">
            <span>{{ formatNumber(row.last_month_balance) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="230" label="*本期匯入金額(已扣除製卡費用)">
          <template #default="{ row }">
            <span>{{ formatNumber(row.current_month_remittance_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="120" label="本期使用金額">
          <template #default="{ row }">
            <span class="text-danger">{{ formatNumber(row.current_month_fuel_total) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="120" label="本期餘額">
          <template #default="{ row }">
            <span>{{ formatNumber(row.current_month_balance) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <p>*本期匯入金額已先預扣本期製卡費用</p>
    </div>
    <div class="car_summary_data">
      <el-table border :data="car_summary_data" height="300">
        <el-table-column align="center" min-width="80" prop="year_month" label="年月" />
        <el-table-column align="center" min-width="100" prop="plate" label="車牌號碼" />
        <el-table-column align="center" min-width="120" prop="product_name" label="油品" />
        <el-table-column align="center" min-width="100" label="公升數合計">
          <template #default="{ row }">
            <span>{{ formatNumber(row.quantity) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="牌價合計">
          <template #default="{ row }">
            <span>{{ formatNumber(row.list_price_subtotal) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="售價合計">
          <template #default="{ row }">
            <span>{{ formatNumber(row.subtotal) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="總里程數">
          <template #default="{ row }">
            <span>{{ formatNumber(row.mileage) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="油耗">
          <template #default="{ row }">
            <span>{{ formatNumber(row.fuel_consumption) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <hr />
    <div class="car_fuel_details mb-5">
      <el-table border :data="groupedData" height="250" :span-method="mergeCells">
        <el-table-column align="center" min-width="80" prop="plate" label="車牌" />
        <el-table-column
          align="center"
          min-width="150"
          prop="transaction_date_time"
          label="交易日期時間"
        />
        <el-table-column align="center" min-width="180" prop="station" label="加油站" />
        <el-table-column align="center" min-width="180" prop="product_name" label="油品" />
        <el-table-column align="center" min-width="80" label="單價">
          <template #default="{ row }">
            <span>{{ formatNumber(row.unit_price) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="80" label="油量">
          <template #default="{ row }">
            <span>{{ formatNumber(row.quantity) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="80" label="折讓">
          <template #default="{ row }">
            <span>{{ formatNumber(row.discount) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="牌價金額">
          <template #default="{ row }">
            <span>{{ formatNumber(row.list_price_subtotal) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="售價小計">
          <template #default="{ row }">
            <span>{{ formatNumber(row.subtotal) }}</span>
          </template>
        </el-table-column>
        <el-table-column align="center" min-width="100" label="里程數">
          <template #default="{ row }">
            <span>{{ formatNumber(row.mileage) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>
