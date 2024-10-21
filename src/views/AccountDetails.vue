<script setup>
import { useSearchAccountStore } from '@/stores/accountStore'
import { ref, onMounted } from 'vue'
const searchAccountStore = useSearchAccountStore()
const bill_year = ref(searchAccountStore.searchAccount.search_month.split('-')[0])
const bill_month = ref(searchAccountStore.searchAccount.search_month.split('-')[1])

// 格式化數字
function formatNumber(value) {
  return value.toLocaleString('en-US')
}
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

function logout() {
  sessionStorage.removeItem('token')
  this.$router.push('/login')
}
</script>
<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center">
      <router-link to>
        <button class="btn btn-yellow mb-2" @click="$router.back(-1)">回上頁</button>
      </router-link>
      <button class="btn btn-yellow" @click="logout">登出</button>
    </div>
    <h4 class="text-center mb-3">
      <span>{{ bill_year }}年</span>
      <span>{{ bill_month }}月</span>
      <span>對帳單明細</span>
    </h4>
    <el-table border :data="groupedData" height="500" :span-method="mergeCells">
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
</template>
