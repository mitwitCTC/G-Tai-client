<script setup>
import TheLayout from '@/components/TheLayout.vue'
import { ref, onMounted, computed } from 'vue'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()
const cus_code = companyStore.company_info.customerId

const isLoading = ref(false)
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
const vehicleDetails = ref([])
async function getVehicleDetails() {
  console.log(cus_code)
  isLoading.value = true
  vehicleDetails.value = [
    {
      acc_name: '分公司Ａ',
      plate: 'AAA-1111',
      product_name: '超級柴油',
      card_num: '#1234567890000000000',
      due_dateTime: '2025-12-01 12:12:12',
      suspend_date: 0
    },
    {
      acc_name: '分公司A',
      plate: 'AAA-2222',
      product_name: '超級柴油',
      card_num: '#1234567890000000000',
      due_dateTime: '2025-12-01 12:12:12',
      suspend_date: '0'
    },
    {
      acc_name: '分公司A',
      plate: 'AAA-3333',
      product_name: '超級柴油',
      card_num: '#1234567890000000000',
      due_dateTime: '2025-12-01 12:12:12',
      suspend_date: '2025-01-01'
    }
  ]
  console.log(vehicleDetails.value)

  setTimeout(() => {
    isLoading.value = false
  }, 1000)
}
onMounted(() => {
  getVehicleDetails()
})

const search_plate = ref('')
// 以車牌搜尋加油交易明細
const filteredVehicleDetails = computed(() => {
  const trimmedPlate = search_plate.value.trim().toUpperCase()
  if (trimmedPlate === '') {
    return vehicleDetails.value
  }
  return vehicleDetails.value.filter((item) => item.plate.includes(trimmedPlate))
})

import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
async function exportExcel() {
  let xlsxParam = { raw: true }
  let wb = XLSX.utils.table_to_book(document.querySelector('#vehicleDetails'), xlsxParam)

  // 獲取工作表
  let ws = wb.Sheets[wb.SheetNames[0]]

  // 設置儲存格格式
  let range = XLSX.utils.decode_range(ws['!ref'])

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let cell_address = { c: C, r: R }
      let cell_ref = XLSX.utils.encode_cell(cell_address)
      let cell = ws[cell_ref]

      if (!cell) continue
      if (!ws[cell_ref].s) ws[cell_ref].s = {}

      // 設置對齊方式
      ws[cell_ref].s.alignment = { horizontal: 'center', vertical: 'center' }

    }
  }

  // 設置欄位寬度
  let colWidths = []
  for (let C = range.s.c; C <= range.e.c; ++C) {
    let maxWidth = 0 // 不設置初始寬度，讓其動態增大
    for (let R = range.s.r; R <= range.e.r; ++R) {
      let cell_address = { c: C, r: R }
      let cell_ref = XLSX.utils.encode_cell(cell_address)
      let cell = ws[cell_ref]

      if (!cell || !cell.v) continue
      let cellValue = cell.v.toString()

      // 針對中文及英文字元做不同的長度調整
      let adjustedLength = cellValue.length
      if (/[\u4e00-\u9fa5]/.test(cellValue)) {
        // 如果包含中文字元，字元寬度需要更大，這裡假設中文字佔用兩個單位寬度
        adjustedLength = cellValue.length * 2
      }

      // 找出此列中最長的內容長度，並動態設置最大寬度
      maxWidth = Math.max(maxWidth, adjustedLength)
    }

    // 避免過窄欄位，設置最小寬度為 10
    colWidths.push({ wch: Math.max(maxWidth, 10) })
  }
  ws['!cols'] = colWidths

  // 將工作簿寫出
  const wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'array' })
  try {
    FileSaver.saveAs(
      new Blob([wbout], { type: 'application/octet-stream' }),
      `車籍明細.xlsx`
    )
  } catch (e) {
    if (console) {
      console.log(e, wbout)
    }
  }
  return wbout
}
</script>
<template>
  <TheLayout>
    <div class="d-flex justify-content-between">
      <el-input
        v-model="search_plate"
        placeholder="請輸入車牌搜尋"
        class="w-50"
        clearable
      ></el-input>
      <button class="btn btn-warning" @click="exportExcel">匯出</button>
    </div>

    <div class="search d-flex mb-3 col-12 col-md-3"></div>
    <el-table
      id="vehicleDetails"
      class="mb-3"
      height="400"
      border
      :data="filteredVehicleDetails"
      v-loading="isLoading"
      element-loading-text="資料載入中..."
      :element-loading-spinner="svg"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    >
      <el-table-column align="center" min-width="200" prop="acc_name" label="帳單名稱" />
      <el-table-column align="center" min-width="200" prop="plate" label="車牌號碼" />
      <el-table-column align="center" min-width="200" prop="product_name" label="產品名稱" />
      <el-table-column align="center" min-width="200" prop="card_num" label="卡號" />
      <el-table-column align="center" min-width="200" prop="due_dateTime" label="到卡日期" />
      <el-table-column align="center" min-width="200" prop="suspend_date" label="停卡日期">
        <template #default="scope">
          {{ scope.row.suspend_date == '0' ? '' : scope.row.suspend_date }}
        </template>
      </el-table-column>
    </el-table>
  </TheLayout>
</template>
