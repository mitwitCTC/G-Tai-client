<script setup>
import { useSearchAccountStore } from '@/stores/accountStore'
import { ref, onMounted } from 'vue'
import router from '@/router'
import ExcelJS from 'exceljs'
const searchAccountStore = useSearchAccountStore()
const bill_year = ref(searchAccountStore.searchAccount.date.split('-')[0])
const bill_month = ref(searchAccountStore.searchAccount.date.split('-')[1])
function insertSummaryRow(worksheet, rowNum, summaryData) {
  // 插入相關欄位的數據
  worksheet.getCell(`D${rowNum}`).value = summaryData.product_name || '' // 插入產品名稱
  worksheet.getCell(`F${rowNum}`).value = summaryData.quantity || 0 // 插入數量
  worksheet.getCell(`H${rowNum}`).value = summaryData.list_price_subtotal || 0 // 插入數量
  worksheet.getCell(`I${rowNum}`).value = summaryData.subtotal || 0 // 插入原價小計
  worksheet.getCell(`J${rowNum}`).value = summaryData.mileage || 0 // 插入實際小計
}
async function exportToExcel2() {
  try {
    // 確保資料先完成取得
    const workbook = new ExcelJS.Workbook()
    const fr = new FileReader()
    const response = await fetch(new URL('@/assets/對帳單明細.xlsx', import.meta.url).href) // 從 URL 載入模板檔案
    const data = await response.blob() // 轉為 Blob
    fr.readAsArrayBuffer(data)

    // 當 FileReader 完成後，讀取 Excel 並進行修改
    fr.onload = async (ev) => {
      await workbook.xlsx.load(ev.target.result)
      const worksheet = workbook.worksheets[0] // 取得第一個工作表
      const date = `${bill_year.value}-${bill_month.value}`
      const customerName = searchAccountStore.searchAccount.customerName
      const invoice_name = searchAccountStore.searchAccount.invoice_name
      const acc_name = searchAccountStore.searchAccount.acc_name
      const customerId = searchAccountStore.searchAccount.customerId
      //公司資訊
      let rowstitle = [[date], [`${customerName}`], [`${invoice_name}`], [`${acc_name}`]]
      rowstitle.forEach((row, index) => {
        worksheet.getCell(`B${1 + index}`).value = row[0] // 將每一行的第一列資料放入指定儲存格
      })

      const data = groupedData.value.map((row) => [
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
        row.isSummary
      ])
      // 起始行
      let startRow = 7
      const summaryRows = [] // 用來記錄小計行的行號
      data.forEach((rowData, rowIndex) => {
        // 如果是 summary row，插入小計
        const currentRowNum = startRow + rowIndex
        if (rowData[10]) {
          insertSummaryRow(worksheet, currentRowNum, {
            product_name: rowData[3],
            quantity: rowData[5],
            list_price_subtotal: rowData[7],
            subtotal: rowData[8],
            mileage: rowData[9]
          })
          summaryRows.push(currentRowNum)
        } else {
          // 普通資料行
          rowData.forEach((cellData, colIndex) => {
            const cellAddress = `${String.fromCharCode(65 + colIndex)}${startRow + rowIndex}`
            const cell = worksheet.getCell(cellAddress)
            cell.value = cellData // 將數據插入單元格
            if (colIndex == 4) {
              cell.numFmt = '#,##0.0'
            } else if (colIndex == 5) {
              cell.numFmt = '#,##0.00'
            } else if (colIndex == 6) {
              cell.numFmt = '#,##0.0'
            } else {
              cell.numFmt = '#,##0'
            }
          })
        }
      })
      summaryRows.forEach((rowNum) => {
        // 合併儲存格 A-C 並設定框線
        worksheet.mergeCells(`A${rowNum}:C${rowNum}`)
        const mergedCell = worksheet.getCell(`A${rowNum}`)
        mergedCell.value = '小計' // 插入 "小計"
        mergedCell.alignment = { horizontal: 'center', vertical: 'middle' } // 居中對齊
        mergedCell.font = { ...mergedCell.font,bold: true } // 粗體（可選）

        // 設定合併儲存格的框線樣式
        mergedCell.border = {
          top: { style: 'thin' }, // 細線
          bottom: { style: 'medium' } // 正常下框線
        }

        // 設定 A-J 所有欄位的框線樣式
        const startCol = 'A' // 開始列
        const endCol = 'J' // 結束列

        for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
          const cellAddress = `${String.fromCharCode(col)}${rowNum}`
          const cell = worksheet.getCell(cellAddress)
          cell.border = {
            top: { style: 'thin' }, // 細線
            bottom: { style: 'medium' } // 正常下框線
          }
        }
      })
      //新增欄位
      if (ProductData.value && ProductData.value.length > 0) {
        const header2 = ['品項', '公升數總計', '牌價總計', '售價總計']
        const columns = ['A', 'C', 'F', 'I']
        let lastRowNumber = 0
        worksheet.eachRow((row, rowNumber) => {
          if (row.hasValues) {
            lastRowNumber = rowNumber
          }
        })

        const lastRowNum = lastRowNumber + 1

        // 使用 String.fromCharCode() 將列編號轉成字母
        const endRow2 = lastRowNum + ProductData.value.length + 1 // 結束行+標題
        for (let row = lastRowNum + 1; row <= endRow2; row++) {
          // 合併 "AB"
          worksheet.mergeCells(`A${row}:B${row}`)
          const cellAB = worksheet.getCell(`A${row}`)
          cellAB.numFmt = '#,##0'

          // 合併 "CDE"
          worksheet.mergeCells(`C${row}:E${row}`)
          const cellCDE = worksheet.getCell(`C${row}`)
          cellCDE.numFmt = '#,##0'

          // 合併 "FGH"
          worksheet.mergeCells(`F${row}:H${row}`)
          const cellFGH = worksheet.getCell(`F${row}`)
          cellFGH.numFmt = '#,##0'

          // 合併 "IJ"
          worksheet.mergeCells(`I${row}:J${row}`)
          const cellIJ = worksheet.getCell(`I${row}`)
          cellIJ.numFmt = '#,##0'
        }
        // 插入表頭

        for (let x = 0; x < header2.length; x++) {
          const column = columns[x] // 根據 A, C, F, I 的欄位
          const tableStartRef = `${column}${lastRowNum + 1}`
          const cell = worksheet.getCell(tableStartRef)

          cell.value = header2[x] // 插入表頭內容
          cell.alignment = { horizontal: 'center' } // 設置文字置中
          cell.font = { ...cell.font,bold: true } // 設置為粗體
          cell.fill = {
            // 設置背景顏色為淺灰色
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'f2f2f2' } // 使用十六進制顏色代碼
          }
        }
        //品項
        for (let x = 0; x <= ProductData.value.length - 1; x++) {
          const tableStartRef = `A${lastRowNum + 2 + x}`
          const cell = worksheet.getCell(tableStartRef)
          cell.value = ProductData.value[x].product_name
          cell.alignment = { horizontal: 'center' }
        }
        //公升數
        for (let x = 0; x <= ProductData.value.length - 1; x++) {
          const tableStartRef = `C${lastRowNum + 2 + x}`
          const cell = worksheet.getCell(tableStartRef)
          cell.value = parseFloat(ProductData.value[x].fuel_volume)
          cell.numFmt = '#,##0.00'
          cell.alignment = { horizontal: 'right' }
        }
        //牌價
        for (let x = 0; x <= ProductData.value.length - 1; x++) {
          const tableStartRef = `F${lastRowNum + 2 + x}`
          worksheet.getCell(tableStartRef).value = parseFloat(ProductData.value[x].reference_amount)
        }
        //售價
        for (let x = 0; x <= ProductData.value.length - 1; x++) {
          const tableStartRef = `I${lastRowNum + 2 + x}`
          worksheet.getCell(tableStartRef).value = parseFloat(ProductData.value[x].amount)
        }
        // 合計
        const totalAmount = ProductData.value.reduce((sum, item) => {
          // 這裡會加總每個 item 的 amount
          return sum + parseFloat(item.amount) // 確保 amount 是數字
        }, 0) // 初始總和是 0
        const lastrow = endRow2 + 1
        worksheet.mergeCells(`A${lastrow}:H${lastrow}`)
        worksheet.mergeCells(`I${lastrow}:J${lastrow}`)
        worksheet.getCell(`A${lastrow}`).value = '合計'
        worksheet.getCell(`I${lastrow}`).value = parseFloat(totalAmount)
        const total = worksheet.getCell(`A${lastrow}`)
        const totalNum = worksheet.getCell(`I${lastrow}`)
        total.font = {
          ...total.font, // 保留現有字體屬性
          bold: true // 設置為粗體
        }
        totalNum.font = {
          ...totalNum.font, // 保留現有字體屬性
          bold: true // 設置為粗體
        }
        worksheet.getCell(`A${lastrow}`).alignment = {
          horizontal: 'right'
        }
        worksheet.getCell(`I${lastrow}`).numFmt = '#,##0'
        worksheet.getCell(`A${lastrow}`).border = {
          top: { style: 'thin', color: { argb: 'C0C0C0' } },
          left: { style: 'thin', color: { argb: 'C0C0C0' } },
          bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
          right: { style: 'thin', color: { argb: 'C0C0C0' } }
        }
        worksheet.getCell(`I${lastrow}`).border = {
          top: { style: 'thin', color: { argb: 'C0C0C0' } },
          left: { style: 'thin', color: { argb: 'C0C0C0' } },
          bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
          right: { style: 'thin', color: { argb: 'C0C0C0' } }
        }
        for (let row = lastRowNum + 1; row <= lastRowNum + ProductData.value.length + 1; row++) {
          for (let col = 65; col <= 74; col++) {
            const cellRef = `${String.fromCharCode(col)}${row}` // 計算儲存格編號
            const cell = worksheet.getCell(cellRef) // 獲取儲存格

            // 設定儲存格的邊框樣式
            cell.border = {
              top: { style: 'thin', color: { argb: 'C0C0C0' } },
              left: { style: 'thin', color: { argb: 'C0C0C0' } },
              bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
              right: { style: 'thin', color: { argb: 'C0C0C0' } }
            }
          }
        }
      }

      //調整欄寬
      const columnsToAdjust = ['A', 'D', 'H', 'I', 'J'] // 需要調整的欄
      columnsToAdjust.forEach((col) => {
        const columnIndex = worksheet.getColumn(col).number // 取得欄位編號
        worksheet.getColumn(columnIndex).width = 14 // 設定欄寬，數字可調整
      })
      worksheet.getColumn(2).width = 22 // 設定B欄寬
      worksheet.getColumn(3).width = 29 // 設定C欄寬
      // 保存到新的文件
      const newFileName = `${bill_year.value}-${bill_month.value}明細_${customerId}_${acc_name}.xlsx`
      const buffer = await workbook.xlsx.writeBuffer()

      // 生成下載鏈接並觸發下載
      const blob = new Blob([buffer], { type: 'application/octet-stream' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = newFileName
      link.click()
    }
  } catch (error) {
    console.error('Error during export to Excel:', error)
  }
}

// 格式化數字
function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : value
}
const car_fuel_details = ref([])
const ProductData = ref([])
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
    await fetchCarSummaryData() //查詢總表
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
  groupDataByPlateAndProduct()
}
// 取得車輛加油概要資料
async function fetchCarSummaryData() {
  try {
    const response = await apiClient.post('/main/accountStatement', {
      date: searchAccountStore.searchAccount.date,
      customerId: searchAccountStore.searchAccount.customerId,
      account_sortId: searchAccountStore.searchAccount.account_sortId
    })
    ProductData.value = response.data.data.product
    const sortOrder = ['超級柴油', '無鉛汽油', '尿素溶液', '諾瓦尿素']

    // 排序邏輯
    ProductData.value.sort((a, b) => {
      const indexA = sortOrder.indexOf(a.product_name)
      const indexB = sortOrder.indexOf(b.product_name)
      return indexA - indexB
    })
  } catch (error) {
    console.error(error)
  }
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
