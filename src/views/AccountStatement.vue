<script setup>
import { useSearchAccountStore } from '@/stores/accountStore'
import { ref, onMounted } from 'vue'
import router from '@/router'
import ExcelJS from 'exceljs'
const searchAccountStore = useSearchAccountStore()
const bill_year = ref(searchAccountStore.searchAccount.date.split('-')[0])
const bill_month = ref(searchAccountStore.searchAccount.date.split('-')[1])

// 格式化數字
function formatNumber(value) {
  return typeof value === 'number' ? value.toLocaleString('en-US') : value
}

// API 根路由
import apiClient from '@/api' // 載入 apiClient
const isLoading = ref(false)
const car_summary_data = ref([])
const ProductData = ref([])
const CardIssuanceFee = ref([])
// 取得車輛加油概要資料
async function fetchCarSummaryData() {
  isLoading.value = true
  try {
    const response = await apiClient.post('/main/accountStatement', {
      date: searchAccountStore.searchAccount.date,
      customerId: searchAccountStore.searchAccount.customerId,
      account_sortId: searchAccountStore.searchAccount.account_sortId
    })
    ProductData.value = response.data.data.product
    CardIssuanceFee.value = response.data.data.cardIssuanceFee
    car_summary_data.value = response.data.data.details.map((item) => ({
      year_month: bill_year.value - 1911 + '/' + bill_month.value,
      plate: item.license_plate,
      product_name: item.product_name, // 品項(油品)
      quantity: Number(item.fuel_volume), // 公升數合計
      list_price_subtotal: Number(item.reference_amount), // 牌價合計
      subtotal: Number(item.amount), // 售價合計
      mileage: item.mileage ? Number(item.mileage) : 0, // 總里程數
      fuel_consumption: item.fuel_consumption ? Number(item.fuel_consumption) : 0 // 油耗
    }))
  } catch (error) {
    console.error(error)
  } finally {
    isLoading.value = false
  }
}
onMounted(() => {
  fetchCarSummaryData()
})

// 匯出
async function exportToExcel() {
  try {
    // 確保資料先完成取得
    const workbook = new ExcelJS.Workbook()
    const fr = new FileReader()
    const transaction_mode = searchAccountStore.searchAccount.transaction_mode
    let response
    if (transaction_mode == 1) {
      response = await fetch(new URL('@/assets/儲值對帳單總表.xlsx', import.meta.url).href) // 從 URL 載入模板儲值檔案
    } else if (transaction_mode == 2) {
      response = await fetch(new URL('@/assets/月結對帳單總表.xlsx', import.meta.url).href) // 從 URL 載入模板月結檔案
    }
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
      const last_month_balance = searchAccountStore.searchAccount.last_month_balance //前期餘額
      const current_month_remittance_amount =
        searchAccountStore.searchAccount.current_month_remittance_amount //本期匯入
      const current_month_fuel_total = searchAccountStore.searchAccount.current_month_fuel_total //本期使用
      const current_month_balance = searchAccountStore.searchAccount.current_month_balance //本期餘額
      const payment_deadline = searchAccountStore.searchAccount.payment_deadline //月結繳款期限
      const config_notes = searchAccountStore.searchAccount.config_notes //擔保品
      const summary_data = car_summary_data.value.map((row) => [
        row.year_month,
        row.plate,
        row.product_name,
        row.quantity,
        row.list_price_subtotal,
        row.subtotal,
        row.mileage,
        row.fuel_consumption
      ])
      //公司資訊
      let rowstitle = [
        [`期別：${date}`],
        [`公司名稱：${customerName}`],
        [`發票抬頭：${invoice_name}`],
        [`帳單組別：${acc_name}`]
      ]
      rowstitle.forEach((row, index) => {
        worksheet.getCell(`B${1 + index}`).value = row[0] // 將每一行的第一列資料放入指定儲存格
      })
       // 插入表頭
       function setCellStyle(cell, value, bold = true, align = 'center', bgColor = 'f2f2f2') {
          cell.value = value
          cell.alignment = { horizontal: align }
          cell.font = { bold: bold }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: bgColor }
          }
        }
      if (transaction_mode == 1) {
        // 儲值
        const data = [
          `${summary_data[0][0]}`,
          `${last_month_balance}`,
          `${current_month_remittance_amount}`,
          `${current_month_fuel_total}`,
          `${current_month_balance}`
        ]
        worksheet.getCell('A7').value = data[0]
        worksheet.getCell('B7').value = data[1]
        worksheet.getCell('C7').value = data[2]
        worksheet.getCell('E7').value = data[3]
        worksheet.getCell('G7').value = data[4]
      } else if (transaction_mode == 2) {
        const total = summary_data.reduce((sum, row) => {
          if (Array.isArray(row) && row.length > 5) {
            return sum + (row[5] || 0)
          }
          return sum // 略過不符合條件的行
        }, 0)
        const items = config_notes.split(', ').map((item) => {
          const match = item.match(/(.+):\s*([\d]+)(.*)/)
          if (match) {
            return {
              config: match[1].trim(), // 提取前面的項目
              config_value: match[2].trim() + match[3]?.trim() // 提取數值
            }
          }
          return null
        })
        const filteredItems = items.filter((item) => item && item.config_value != 0)
        
        // 分別取出 config 和 config_value
        const configs = filteredItems.map((item) => item.config)
        const config_values = filteredItems.map((item) => item.config_value)
        const data = [
          `${configs}`,
          `${config_values}`,
          `${payment_deadline}`,
          `${total}`
        ]
        worksheet.getCell('A7').value = data[0]
        worksheet.getCell('C7').value = data[1]
        worksheet.getCell('E7').value = data[2]
        worksheet.getCell('G7').value = data[3]
        worksheet.getCell('G7').value = parseFloat(data[3]) // 轉數值
        worksheet.getCell('G7').numFmt = '#,##0' // 千分位格式
      }
      //主資料
      const startRow = 10 // 表格起始行
      const endRow = startRow + summary_data.length - 1 // 結束行
      const startCol = 'A' // 起始列
      const endCol = String.fromCharCode(startCol.charCodeAt(0) + 7) // 結束列

      summary_data.forEach((rowData, rowIndex) => {
        rowData.forEach((cellData, colIndex) => {
          const colLetter = String.fromCharCode(65 + colIndex) // 計算列字母，A = 65 ASCII
          const cellRef = `${colLetter}${startRow + rowIndex}` // 定位儲存格位置
          worksheet.getCell(cellRef).value = cellData // 填入數據
        })
      })
      //千分位
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol.charCodeAt(0); col <= endCol.charCodeAt(0); col++) {
          const cell = worksheet.getCell(`${String.fromCharCode(col)}${row}`)
          cell.numFmt = '#,##0'
        }
      }
      // 居中對齊
      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol.charCodeAt(0); col <= 67; col++) {
          const cell = worksheet.getCell(`${String.fromCharCode(col)}${row}`)
          cell.alignment = { horizontal: 'center' }
        }
      }
      let lastRowNumber = 0
      worksheet.eachRow((row, rowNumber) => {
        if (row.hasValues) {
          lastRowNumber = rowNumber
        }
      })
      const header2 = ['品項', '公升數總計', '牌價總計', '售價總計']
      const lastRowNum = lastRowNumber + 1
      // 使用 String.fromCharCode() 將列編號轉成字母
      const endRow2 = lastRowNum + ProductData.value.length + 1 // 結束行+標題

      for (let row = lastRowNum + 1; row <= endRow2; row++) {
        for (let col = startCol.charCodeAt(0); col <= 71; col++) {
          const cell = worksheet.getCell(`${String.fromCharCode(col)}${row}`)
          if (col % 2 == 1) {
            worksheet.mergeCells(
              `${String.fromCharCode(col)}${row}:${String.fromCharCode(col + 1)}${row}`
            )
          }
          cell.numFmt = '#,##0'
        }
      }

      // 插入表頭
      for (let x = 0; x <= 3; x++) {
        const column = String.fromCharCode(65 + x * 2) // 65 是 'A' 的 ASCII 代碼
        const tableStartRef = `${column}${lastRowNum + 1}`
        const cell = worksheet.getCell(tableStartRef)
        cell.value = header2[x]
        cell.alignment = { horizontal: 'center' }
        cell.font = { bold: true } // 設置為粗體
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
        cell.alignment = { horizontal: 'right' }
      }
      //牌價
      for (let x = 0; x <= ProductData.value.length - 1; x++) {
        const tableStartRef = `E${lastRowNum + 2 + x}`
        worksheet.getCell(tableStartRef).value = parseFloat(ProductData.value[x].reference_amount)
      }
      //售價
      for (let x = 0; x <= ProductData.value.length - 1; x++) {
        const tableStartRef = `G${lastRowNum + 2 + x}`
        worksheet.getCell(tableStartRef).value = parseFloat(ProductData.value[x].amount)
      }
      // 合計
      const totalAmount = ProductData.value.reduce((sum, item) => {
        // 這裡會加總每個 item 的 amount
        return sum + parseFloat(item.amount) // 確保 amount 是數字
      }, 0) // 初始總和是 0
      const lastrow = endRow2 + 1
      worksheet.mergeCells(`A${lastrow}:F${lastrow}`)
      worksheet.mergeCells(`G${lastrow}:H${lastrow}`)
      worksheet.getCell(`A${lastrow}`).value = '合計'
      worksheet.getCell(`G${lastrow}`).value = parseFloat(totalAmount)
      worksheet.getCell(`A${lastrow}`).font = { bold: true }
      worksheet.getCell(`G${lastrow}`).font = { bold: true }
      worksheet.getCell(`A${lastrow}`).alignment = { horizontal: 'right' }
      worksheet.getCell(`G${lastrow}`).numFmt = '#,##0'
      worksheet.getCell(`A${lastrow}`).border = {
        top: { style: 'thin', color: { argb: 'C0C0C0' } },
        left: { style: 'thin', color: { argb: 'C0C0C0' } },
        bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
        right: { style: 'thin', color: { argb: 'C0C0C0' } }
      }
      worksheet.getCell(`G${lastrow}`).border = {
        top: { style: 'thin', color: { argb: 'C0C0C0' } },
        left: { style: 'thin', color: { argb: 'C0C0C0' } },
        bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
        right: { style: 'thin', color: { argb: 'C0C0C0' } }
      }
      //製卡資料
      if (CardIssuanceFee.value.length > 0) {
        const thelastrow = lastrow + 2
        const header3 = ['製作日期', '車牌號碼', '車隊卡卡號', '製卡類別', '製卡費用']
        // 使用 String.fromCharCode() 將列編號轉成字母

        const endRow3 = thelastrow + CardIssuanceFee.value.length // 結束行+標題

        for (let row = thelastrow; row <= endRow3; row++) {
          for (let col = startCol.charCodeAt(0); col <= 71; col++) {
            const cell = worksheet.getCell(`${String.fromCharCode(col)}${row}`)
            if (col != 65) {
              if (col % 2 == 1) {
                worksheet.mergeCells(
                  `${String.fromCharCode(col)}${row}:${String.fromCharCode(col + 1)}${row}`
                )
              }
            }
            cell.numFmt = '#,##0'
            cell.border = {
              top: { style: 'thin', color: { argb: 'C0C0C0' } },
              left: { style: 'thin', color: { argb: 'C0C0C0' } },
              bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
              right: { style: 'thin', color: { argb: 'C0C0C0' } }
            }
          }
        }

       
        const getA = worksheet.getCell(`A${thelastrow}`)
        const getB = worksheet.getCell(`B${thelastrow}`)
        const getC = worksheet.getCell(`C${thelastrow}`)
        const getE = worksheet.getCell(`E${thelastrow}`)
        const getG = worksheet.getCell(`G${thelastrow}`)
        setCellStyle(getA, header3[0])
        setCellStyle(getB, header3[1])
        setCellStyle(getC, header3[2])
        setCellStyle(getE, header3[3])
        setCellStyle(getG, header3[4])
        //製卡資料
        //製作日期
        for (let x = 0; x <= CardIssuanceFee.value.length - 1; x++) {
          const tableStartRef = `A${thelastrow + 1 + x}`
          const cell = worksheet.getCell(tableStartRef)
          cell.value = CardIssuanceFee.value[x].credit_amount
          cell.alignment = { horizontal: 'center' }
        }
        //車牌號碼
        for (let x = 0; x <= CardIssuanceFee.value.length - 1; x++) {
          const tableStartRef = `B${thelastrow + 1 + x}`
          const cell = worksheet.getCell(tableStartRef)
          cell.value = CardIssuanceFee.value[x].bank_amount
          cell.alignment = { horizontal: 'center' }
        }
        //車隊卡卡號
        for (let x = 0; x <= CardIssuanceFee.value.length - 1; x++) {
          const tableStartRef = `C${thelastrow + 1 + x}`
          const cell = worksheet.getCell(tableStartRef)
          cell.value = CardIssuanceFee.value[x].credit_card_data
          cell.alignment = { horizontal: 'center' }
        }
        //製卡類別
        for (let x = 0; x <= CardIssuanceFee.value.length - 1; x++) {
          const tableStartRef = `E${thelastrow + 1 + x}`
          const cell = worksheet.getCell(tableStartRef)
          cell.value = CardIssuanceFee.value[x].bank
          cell.alignment = { horizontal: 'center' }
        }
        //製卡費用
        for (let x = 0; x <= CardIssuanceFee.value.length - 1; x++) {
          const tableStartRef = `G${thelastrow + 1 + x}`
          const cell = worksheet.getCell(tableStartRef)
          cell.value = Number(CardIssuanceFee.value[x].amount)
          cell.numFmt = '#,##0'
        }

        //合計
        const totalAmount2 = CardIssuanceFee.value.reduce((sum, item) => {
          // 這裡會加總每個 item 的 amount
          return sum + parseFloat(item.amount) // 確保 amount 是數字
        }, 0) // 初始總和是 0
        const lastrow2 = thelastrow + CardIssuanceFee.value.length + 1
        worksheet.mergeCells(`A${lastrow2}:F${lastrow2}`)
        worksheet.mergeCells(`G${lastrow2}:H${lastrow2}`)
        worksheet.getCell(`A${lastrow2}`).value = '合計'
        worksheet.getCell(`G${lastrow2}`).value = Number(totalAmount2)
        worksheet.getCell(`A${lastrow2}`).font = { bold: true }
        worksheet.getCell(`G${lastrow2}`).font = { bold: true }
        worksheet.getCell(`A${lastrow2}`).alignment = { horizontal: 'right' }
        worksheet.getCell(`G${lastrow2}`).numFmt = '#,##0'
        worksheet.getCell(`A${lastrow2}`).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        worksheet.getCell(`G${lastrow2}`).border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      }
      // 字型
      worksheet.eachRow((row) => {
        row.eachCell((cell) => {
          // 取得當前儲存格的字型設定
          const currentFont = cell.font || {}

          // 設定字型大小為 12，字型為 "Times New Roman" 或 "新細明體"，並保留原有的粗體等屬性
          cell.font = {
            ...currentFont,
            size: 12,
            name: 'Times New Roman' // 如果想要新細明體，設為 "PMingLiU"
          }
          cell.border = {
            top: { style: 'thin', color: { argb: 'C0C0C0' } },
            left: { style: 'thin', color: { argb: 'C0C0C0' } },
            bottom: { style: 'thin', color: { argb: 'C0C0C0' } },
            right: { style: 'thin', color: { argb: 'C0C0C0' } }
          }
        })
      })
      const rowToClear = 8 // 要清除框線的行
      const rowToAddTopBorder = 9 // 要添加上框線的行
      const start = 'A' // 起始列
      const end = 'G' // 結束列

      // 刪除 A8-G8 的所有框線
      for (let col = start.charCodeAt(0); col <= end.charCodeAt(0); col++) {
        const cell = worksheet.getCell(`${String.fromCharCode(col)}${rowToClear}`)
        cell.border = undefined // 清除框線
      }
      // 添加 A9-G9 的上框線
      for (let col = start.charCodeAt(0); col <= end.charCodeAt(0); col++) {
        const cell = worksheet.getCell(`${String.fromCharCode(col)}${rowToAddTopBorder}`)
        cell.border = {
          top: { style: 'thin', color: { argb: 'C0C0C0' } }, // 添加銀色細邊框
          left: { style: 'thin', color: { argb: 'C0C0C0' } }, // 添加銀色細邊框
          right: { style: 'thin', color: { argb: 'C0C0C0' } } // 添加銀色細邊框
        }
      }
      // 保存到新的文件
      const newFileName = `${bill_year.value}-${bill_month.value}對帳單總表.xlsx`
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
      <span>對帳單總表</span>
    </h4>
    <div class="d-flex justify-content-end mb-3">
      <button class="btn btn-warning" @click="exportToExcel" :disabled="isLoading">匯出</button>
    </div>
    <el-table border :data="car_summary_data" height="300" v-loading="isLoading">
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
    <el-table border :data="car_summary_data" id="car_summary_data" class="d-none">
      <el-table-column align="center" min-width="80" prop="year_month" label="年月" />
      <el-table-column align="center" min-width="100" prop="plate" label="車牌號碼" />
      <el-table-column align="center" min-width="120" prop="product_name" label="油品" />
      <el-table-column align="center" min-width="100" prop="quantity" label="公升數合計" />
      <el-table-column align="center" min-width="100" prop="list_price_subtotal" label="牌價合計" />
      <el-table-column align="center" min-width="100" prop="subtotal" label="售價合計" />
      <el-table-column align="center" min-width="100" prop="mileage" label="總里程數" />
      <el-table-column align="center" min-width="100" prop="fuel_consumption" label="油耗" />
    </el-table>
  </div>
</template>
