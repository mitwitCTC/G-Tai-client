<script setup>
import { useSearchAccountStore } from '@/stores/accountStore'
import { ref, onMounted } from 'vue'
import router from '@/router'
import FileSaver from 'file-saver'
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'//JASON 2024.11.22
const searchAccountStore = useSearchAccountStore()
const bill_year = ref(searchAccountStore.searchAccount.date.split('-')[0])
const bill_month = ref(searchAccountStore.searchAccount.date.split('-')[1])
//JASON 2024.11.22
function insertSummaryRow(worksheet, rowNum, summaryData) {
  // 插入相關欄位的數據
  worksheet.getCell(`D${rowNum}`).value = summaryData.product_name || ""; // 插入產品名稱
  worksheet.getCell(`F${rowNum}`).value = summaryData.quantity || 0;    // 插入數量
  worksheet.getCell(`I${rowNum}`).value = summaryData.list_price_subtotal || 0; // 插入原價小計
  worksheet.getCell(`J${rowNum}`).value = summaryData.subtotal || 0;    // 插入實際小計

}
async function exportToExcel2() {
          try {
            // 確保資料先完成取得
            const workbook = new ExcelJS.Workbook();
            const fr = new FileReader();
            const response = await fetch(new URL('@/assets/對帳單明細.xlsx', import.meta.url).href); // 從 URL 載入模板檔案
            const data = await response.blob(); // 轉為 Blob
            fr.readAsArrayBuffer(data);

            // 當 FileReader 完成後，讀取 Excel 並進行修改
            fr.onload = async (ev) => {
              await workbook.xlsx.load(ev.target.result);
              const worksheet = workbook.worksheets[0]; // 取得第一個工作表
              const date=`${bill_year.value}-${bill_month.value}`
              const customerName= searchAccountStore.searchAccount.customerName
              const invoice_name= searchAccountStore.searchAccount.invoice_name
              const acc_name = searchAccountStore.searchAccount.acc_name
              //公司資訊
              let rowstitle=[[date],[`公司名稱：${customerName}`],[`發票抬頭：${invoice_name}`],[`帳單組別：${acc_name}`]];
              rowstitle.forEach((row, index) => {
              worksheet.getCell(`B${1 + index}`).value = row[0]; // 將每一行的第一列資料放入指定儲存格
              });
         
              const data = groupedData.value
              .map((row) => [
                row.plate,
                `${row.transaction_date} ${row.transaction_time}`,
                row.station,
                row.product_name,
                row.unit_price,
                row.quantity,
                row.discount,
                row.list_price_subtotal,
                row.subtotal,
                row.mileage,
                row.isSummary,
              ]);
              // 起始行
              let startRow = 7;
              const summaryRows = []; // 用來記錄小計行的行號
              data.forEach((rowData, rowIndex) => {
              // 如果是 summary row，插入小計
              const currentRowNum = startRow + rowIndex;
              if (rowData[10]) {
                insertSummaryRow(worksheet, currentRowNum, {
                  product_name: rowData[3],
                  quantity: rowData[5],
                  list_price_subtotal: rowData[7],
                  subtotal: rowData[8],
                  mileage:[9]
                });
                summaryRows.push(currentRowNum);
               } else {
                // 普通資料行
                rowData.forEach((cellData, colIndex) => {
                  const cellAddress = `${String.fromCharCode(65 + colIndex)}${startRow + rowIndex}`;
                  const cell = worksheet.getCell(cellAddress);
                  cell.value = cellData; // 將數據插入單元格
                });
              }
            });
            summaryRows.forEach((rowNum) => {
              // 合併儲存格 A-C 並設定框線
              worksheet.mergeCells(`A${rowNum}:C${rowNum}`);
              const mergedCell = worksheet.getCell(`A${rowNum}`);
              mergedCell.value = "小計"; // 插入 "小計"
              mergedCell.alignment = { horizontal: 'center', vertical: 'middle' }; // 居中對齊
              mergedCell.font = { bold: true }; // 粗體（可選）

              // 設定合併儲存格的框線樣式
              mergedCell.border = {
                top: { style: 'thin' },         // 細線
                bottom: { style: 'medium' },    // 正常下框線
              };

              // 設定 A-J 所有欄位的框線樣式
              const startCol = 'A'; // 開始列
              const endCol = 'J';   // 結束列

              for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
                const cellAddress = `${String.fromCharCode(col)}${rowNum}`;
                const cell = worksheet.getCell(cellAddress);
                cell.border = {
                  top: { style: 'thin' },         // 細線
                  bottom: { style: 'medium' },    // 正常下框線
                };
              }
});
              // 保存到新的文件
              const newFileName = '明細測試.xlsx';
              const buffer = await workbook.xlsx.writeBuffer();

              // 生成下載鏈接並觸發下載
              const blob = new Blob([buffer], { type: 'application/octet-stream' });
              const link = document.createElement('a');
              link.href = URL.createObjectURL(blob);
              link.download = newFileName;
              link.click();
            } 
          } catch (error) {
            console.error('Error during export to Excel:', error);
          }
}

// 格式化數字
function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : value
}
const car_fuel_details = ref([])
// 分組數據的變量
const groupedData = ref([])

// API 根路由
import apiClient from '@/api' // 載入 apiClient
const isLoading = ref(false)
// 初始化時獲取數據
async function fetchCarFuelDetails() {
  isLoading.value = true
  try {
    const response = await apiClient.post('/main/accountDetails', {
      date: searchAccountStore.searchAccount.date,
      customerId: searchAccountStore.searchAccount.customerId,
      account_sortId: searchAccountStore.searchAccount.account_sortId
    })
    car_fuel_details.value = response.data.data.map((item) => ({
      plate: item.license_plate,
      transaction_date: item.trade_time.split(' ')[0],
      transaction_time: item.trade_time.split(' ')[1],
      station: item.station_name,
      product_name: getProductName(item.fuel_type),
      unit_price: Number(item.reference_price),
      quantity: Number(item.fuel_volume),
      discount: Number(item.discount),
      list_price_subtotal: Number(item.reference_amount),
      subtotal: Number(item.salesAmount),
      mileage: Number(item.mileage)
    }))
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
  groupDataByPlateAndProduct()
}

// 調整油品欄位資料
function getProductName(fuelType) {
  let productName = fuelType.split(' ')[1] || fuelType
  const fuelTypes = ['92無鉛', '95無鉛', '98無鉛']

  if (fuelTypes.some((type) => productName.startsWith(type))) {
    productName += '汽油'
  }

  return productName
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
          quantity: acc.quantity + Number(item.quantity),
          list_price_subtotal: acc.list_price_subtotal + Number(item.list_price_subtotal),
          subtotal: acc.subtotal + Number(item.subtotal)
        }),
        {
          product_name: '',
          quantity: 0,
          list_price_subtotal: 0,
          subtotal: 0,
          mileage: 0
        }
      )

      // 計算該組別的里程數差值
      const mileageDifference = group.data[group.data.length - 1].mileage - group.data[0].mileage
      // 插入小計行
      grouped.push({
        plate: '小計',
        transaction_date: '',
        transaction_time: '',
        station: '',
        product_name: subtotal.product_name, // 油品名稱
        unit_price: '', // 不顯示單價
        quantity: subtotal.quantity, // 顯示油量的總計
        discount: '', // 折讓不顯示
        list_price_subtotal: subtotal.list_price_subtotal, // 牌價金額總計
        subtotal: subtotal.subtotal, // 售價小計總計
        mileage: mileageDifference, // 里程數差額
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

// 匯出
// function exportExcel() {
//   let xlsxParam = { raw: true }
//   let wb = XLSX.utils.table_to_book(document.querySelector('#car_fuel_details'), xlsxParam)

//   // 獲取工作表
//   let ws = wb.Sheets[wb.SheetNames[0]]

//   // 設置儲存格格式
//   let range = XLSX.utils.decode_range(ws['!ref'])

//   // 中文欄位名稱與英文變數名稱的對應表
//   const fieldMap = {
//     單價: 'unit_price',
//     油量: 'quantity',
//     折讓: 'discount',
//     牌價金額: 'list_price_subtotal',
//     售價小計: 'subtotal',
//     里程數: 'mileage'
//   }

//   const formatRules = {
//     unit_price: '#,##0.0', // 單價保留一位小數
//     discount: '#,##0.0', // 折讓保留一位小數
//     quantity: '#,##0.00', // 油量保留一位小數
//     list_price_subtotal: '#,##0',
//     subtotal: '#,##0',
//     mileage: '#,##0'
//   }

//   // 所有需要格式化的數字欄位
//   const numberFields = Object.keys(formatRules)

//   for (let R = range.s.r; R <= range.e.r; ++R) {
//     for (let C = range.s.c; C <= range.e.c; ++C) {
//       let cell_address = { c: C, r: R }
//       let cell_ref = XLSX.utils.encode_cell(cell_address)
//       let cell = ws[cell_ref]

//       if (!cell) continue
//       if (!ws[cell_ref].s) ws[cell_ref].s = {}

//       // 設置對齊方式
//       ws[cell_ref].s.alignment = { horizontal: 'center', vertical: 'center' }

//       // 取得欄位名稱，進行對應映射
//       let columnHeader = ws[XLSX.utils.encode_cell({ c: C, r: 0 })]?.v?.toString()?.trim()

//       if (R > 0 && fieldMap[columnHeader]) {
//         const field = fieldMap[columnHeader]

//         // 檢查是否需要格式化
//         if (numberFields.includes(field)) {
//           // 移除千位分隔符後再轉換為數字
//           if (cell && typeof cell.v === 'string') {
//             cell.v = cell.v.replace(/,/g, '') // 去除千位分隔符
//           }

//           if (cell && !isNaN(parseFloat(cell.v))) {
//             cell.t = 'n' // 將儲存格格式設為數字
//             cell.z = formatRules[field] // 根據格式規則設置格式
//           } else {
//             cell.v = 0 // 若不是數字則設為 0
//           }
//         } else if (!isNaN(cell.v)) {
//           // 對其他數字欄位使用預設千分位格式
//           cell.t = 'n'
//           cell.z = '#,##0' // 千分位格式
//         }
//       }
//     }
//   }

//   // 設置欄位寬度
//   let colWidths = []
//   for (let C = range.s.c; C <= range.e.c; ++C) {
//     let maxWidth = 0 // 不設置初始寬度，讓其動態增大
//     for (let R = range.s.r; R <= range.e.r; ++R) {
//       let cell_address = { c: C, r: R }
//       let cell_ref = XLSX.utils.encode_cell(cell_address)
//       let cell = ws[cell_ref]

//       if (!cell || !cell.v) continue
//       let cellValue = cell.v.toString()

//       // 針對中文及英文字元做不同的長度調整
//       let adjustedLength = cellValue.length
//       if (/[\u4e00-\u9fa5]/.test(cellValue)) {
//         // 如果包含中文字元，字元寬度需要更大，這裡假設中文字佔用兩個單位寬度
//         adjustedLength = cellValue.length * 2
//       }

//       // 找出此列中最長的內容長度，並動態設置最大寬度
//       maxWidth = Math.max(maxWidth, adjustedLength)
//     }

//     // 避免過窄欄位，設置最小寬度為 10
//     colWidths.push({ wch: Math.max(maxWidth, 10) })
//   }
//   ws['!cols'] = colWidths

//   // 將工作簿寫出
//   const wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'array' })
//   try {
//     FileSaver.saveAs(
//       new Blob([wbout], { type: 'application/octet-stream' }),
//       `${bill_year.value}-${bill_month.value}對帳單明細.xlsx`
//     )
//   } catch (e) {
//     if (console) {
//       console.log(e, wbout)
//     }
//   }
//   return wbout
// }

function logout() {
  sessionStorage.clear()
  router.push('/login')
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
    <div class="d-flex justify-content-end mb-3">
      <button class="btn btn-warning" @click="exportToExcel2" :disabled="isLoading">匯出</button>
    </div>
    <el-table
      border
      :data="groupedData"
      id="car_fuel_details"
      v-loading="isLoading"
      height="500"
      :span-method="mergeCells"
    >
      <el-table-column align="center" min-width="80" prop="plate" label="車牌" />
      <el-table-column align="center" min-width="150" prop="transaction_date" label="交易日期" />
      <el-table-column align="center" min-width="150" prop="transaction_time" label="交易時間" />
      <el-table-column align="center" min-width="180" prop="station" label="加油站" />
      <el-table-column align="center" min-width="180" prop="product_name" label="油品" />
      <el-table-column align="center" min-width="80" label="單價">
        <template #default="{ row }">
          <span>{{ formatNumber(row.unit_price) }}</span>
        </template>
      </el-table-column>
      <el-table-column align="center" min-width="100" label="油量">
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
