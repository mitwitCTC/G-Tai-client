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

import apiServer from '@/apiServer'
const vehicleDetailsApiRes = ref([])
const vehicleDetails = ref([])
async function getVehicleDetails() {
  isLoading.value = true
  try {
    const response = await apiServer.post('/main/exportcard', {
      customerId: cus_code
    })
    if (response.data.returnCode == 0) {
      vehicleDetailsApiRes.value = response.data.data
      vehicleDetails.value = vehicleDetailsApiRes.value.map((item) => ({
        acc_name: item.cus_name,
        plate: item.license_plate,
        product_name:
          item.card_type === '1'
            ? '尿素'
            : item.card_type === '2'
              ? '柴油'
              : item.card_type === '3'
                ? '汽油'
                : '諾瓦尿素',
        card_num: item.card_number,
        due_dateTime: item.card_arrival_date,
        suspend_date: item.card_stop_date
      }))
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
onMounted(() => {
  getVehicleDetails()
})

const search_plate = ref('')
// 以車牌搜尋車籍明細
const filteredVehicleDetails = computed(() => {
  const trimmedPlate = search_plate.value.trim().toUpperCase()
  if (trimmedPlate === '') {
    return vehicleDetails.value
  }
  return vehicleDetails.value.filter((item) => item.plate.includes(trimmedPlate))
})

import ExcelJS from "exceljs";

async function exportExcel(apiData) {
  try {
    const workbook = new ExcelJS.Workbook();
    const response = await fetch(new URL('@/assets/車籍資料表.xlsx', import.meta.url).href);
    const data = await response.arrayBuffer();
    
    await workbook.xlsx.load(data);
    const worksheet = workbook.worksheets[0];

    // Start filling data from row 2 (assuming row 1 is header)
    apiData.forEach((data, index) => {
      const rowIndex = index + 2;
      worksheet.getCell(`A${rowIndex}`).value = data.customerId || '';
      worksheet.getCell(`B${rowIndex}`).value = data.cus_name || '';
      worksheet.getCell(`C${rowIndex}`).value = data.acc_name || '';
      worksheet.getCell(`D${rowIndex}`).value = data.use_number || '';
      worksheet.getCell(`E${rowIndex}`).value = data.license_plate || '';
      worksheet.getCell(`F${rowIndex}`).value = 
        data.card_type === '1' ? '尿素' :
        data.card_type === '2' ? '柴油' :
        data.card_type === '3' ? '汽油' :
        data.card_type === '4' ? '諾瓦尿素' : data.card_type || '';
      worksheet.getCell(`G${rowIndex}`).value = data.card_number || '';
      worksheet.getCell(`H${rowIndex}`).value = data.upload_reason || '';
      worksheet.getCell(`I${rowIndex}`).value = data.card_arrival_date == '0' ? '' : data.card_arrival_date || '';
      worksheet.getCell(`J${rowIndex}`).value = data.card_stop_date == '0' ? '' : data.card_stop_date || '';
      worksheet.getCell(`K${rowIndex}`).value = data.del == '0' ? '' : data.del || '';
      worksheet.getCell(`L${rowIndex}`).value = data.notes || '';
    });

    // Adjust column widths
    worksheet.getColumn(2).width = 50;
    worksheet.getColumn(3).width = 60;
    worksheet.getColumn(12).width = 80;

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${apiData[0].customerId}_${apiData[0].cus_name}_車籍資料表.xlsx`;
    link.click();
  } catch (error) {
    console.error('Export failed:', error);
  }
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
      <button class="btn btn-warning" @click="exportExcel(vehicleDetailsApiRes)">匯出</button>
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
      <el-table-column align="center" min-width="200" prop="due_dateTime" label="到卡日期">
        <template #default="scope">
          {{ scope.row.due_dateTime == '0' ? '' : scope.row.due_dateTime }}
        </template>
      </el-table-column>
      <el-table-column align="center" min-width="200" prop="suspend_date" label="停卡日期">
        <template #default="scope">
          {{ scope.row.suspend_date == '0' ? '' : scope.row.suspend_date }}
        </template>
      </el-table-column>
    </el-table>
  </TheLayout>
</template>
