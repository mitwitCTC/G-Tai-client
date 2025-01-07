<script setup>
import { ref, onMounted } from 'vue'
import router from '@/router'
import { ElLoading } from 'element-plus'

const cus_code = ref('')
const cus_name = ref('')
const search_month = ref('')
function getLastMonth() {
  let today = new Date()
  let year = today.getFullYear()
  let month = today.getMonth()
  if (month == 0) {
    year -= 1
    month = 12
  }
  search_month.value = year + '-' + String(month).padStart(2, '0')
}
onMounted(() => {
  getLastMonth()
  cus_code.value = atob(router.currentRoute.value.query.c)
})

// API 根路由
import apiClient from '@/api' // 載入 apiClient
import apiServer from '@/apiServer'
const isGettingCompanyInfo = ref(false)
async function getCompanyInfo() {
  isGettingCompanyInfo.value = true

  try {
    const response = await apiServer.post('/main/searchCustomer', {
      cus_code: cus_code.value
    })
    if (cus_code.value == '') {
      alert('查無客代')
    }
    if(response.data.data.length == 0){
      alert('查無客戶資料')
    } else {
      cus_name.value = response.data.data[0]?.cus_name
      checkDataAvailability()
    }
  } catch (error) {
    console.error(error)
    alert('系統錯誤')
  } finally {
    isGettingCompanyInfo.value = false
  }
}
onMounted(() => {
  getCompanyInfo()
})

const reconciliationAndInvoice_list = ref([])
const loadingInstance = ref(null)
const isChecking = ref(false)
async function checkDataAvailability() {
  isChecking.value = true
  // 顯示 loading 遮罩
  loadingInstance.value = ElLoading.service({
    fullscreen: true,
    text: '載入中...',
    background: 'rgba(0, 0, 0, 0.5)'
  })
  try {
    const response = await apiClient.post('/main/dataJudgment', {
      date: search_month.value
    })
    if (response.data.returnCode == 0) {
      searchAccountGroup()
      getInvoiceList()
    } else {
      reconciliationAndInvoice_list.value = []
    }
  } catch (error) {
    console.error(error)
    reconciliationAndInvoice_list.value = []
  } finally {
    setTimeout(() => {
      loadingInstance.value.close()
    }, 1000)
    isChecking.value = false
  }
}

const isLoadingReconciliationAndInvoice_list = ref(false)
async function searchAccountGroup() {
  isLoadingReconciliationAndInvoice_list.value = true
  try {
    const response = await apiClient.post('/main/accountGroup', {
      date: search_month.value,
      customerId: cus_code.value
    })
    reconciliationAndInvoice_list.value = response.data.data
    mergeInvoiceData()
  } catch (error) {
    console.error(error)
  } finally {
    isLoadingReconciliationAndInvoice_list.value = false
  }
}

const isLoadingInvoiceList = ref(false)
const invoiceList = ref([])
async function getInvoiceList() {
  isLoadingInvoiceList.value = true
  try {
    const response = await apiClient.post('/main/searchInvoice', {
      date: search_month.value,
      customerId: cus_code.value
    })
    if (response.data.returnCode == 0) {
      invoiceList.value = response.data.data
      mergeInvoiceData()
    } else {
      invoiceList.value = []
    }
  } catch (error) {
    console.error(error)
  } finally {
    isLoadingInvoiceList.value = false
  }
}

function mergeInvoiceData() {
  // 檢查兩個列表是否已獲取
  if (!reconciliationAndInvoice_list.value.length || !invoiceList.value.length) return

  // 按照 account_sortId 合併發票資料
  reconciliationAndInvoice_list.value = reconciliationAndInvoice_list.value.map((item) => {
    // 找到所有與該帳單相關的發票
    const matchedInvoices = invoiceList.value.filter(
      (invoice) => invoice.account_sortId === item.account_sortId
    )
    
    // 將 matchedInvoices 的發票號碼收集到陣列中
    return {
      ...item,
      invoiceNums: matchedInvoices.map((invoice) => invoice.invoiceNum), // 收集發票號碼
    }
  })
}
// loading 狀態
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
const isdownloadingAccountStatement = ref(false)
async function downloadAccountStatement(account_sortId, acc_name) {
  isdownloadingAccountStatement.value = true
  try {
    const response = await apiClient.post(
      '/main/downloadAccountStatement',
      {
        date: search_month.value,
        customerId: cus_code.value,
        account_sortId: account_sortId
      },
      { responseType: 'blob' } // 確保回傳型態是二進位
    )

    if (response.data.returnCode == -1 || response.data.returnCode == -2) {
      alert(response.data.message)
    }
    // 檢查回傳的資料
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('回傳資料非有效 PDF 格式')
    }
    const fileName = `${search_month.value}總表_${cus_code.value}_${acc_name}.pdf`

    downloadFile(new Blob([response.data]), fileName)
  } catch (error) {
    alert('下載失敗')
    console.error(error)
  } finally {
    isdownloadingAccountStatement.value = false
  }
}
const isdownloadingAccountDetails = ref(false)
async function downloadAccountDetails(account_sortId, acc_name) {
  isdownloadingAccountDetails.value = true
  try {
    const response = await apiClient.post(
      '/main/downloadAccountDetails',
      {
        date: search_month.value,
        customerId: cus_code.value,
        account_sortId: account_sortId
      },
      { responseType: 'blob' } // 確保回傳型態是二進位
    )

    if (response.data.returnCode == -1 || response.data.returnCode == -2) {
      alert(response.data.message)
    }
    // 檢查回傳的資料
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('回傳資料非有效 PDF 格式')
    }
    const fileName = `${search_month.value}明細_${cus_code.value}_${acc_name}.pdf`

    downloadFile(new Blob([response.data]), fileName)
  } catch (error) {
    alert('下載失敗')
    console.error(error)
  } finally {
    isdownloadingAccountDetails.value = false
  }
}

const isDownloadingInvoice = ref(false)
async function downloadInvoice(account_sortId, acc_name, invoiceNum) {
  isDownloadingInvoice.value = true

  try {
    const response = await apiClient.post(
      '/main/downloadInvoice',
      {
        date: search_month.value,
        customerId: cus_code.value,
        invoiceNum: invoiceNum
      },
      { responseType: 'blob' } // 確保回傳型態是二進位
    )

    if (response.data.returnCode == -1 || response.data.returnCode == -2) {
      alert(response.data.message)
    }
    // 檢查回傳的資料
    if (!response.data || !(response.data instanceof Blob)) {
      throw new Error('回傳資料非有效 PDF 格式')
    }
    const fileName = `${search_month.value}發票_${cus_code.value}_${acc_name}.pdf`
    downloadFile(new Blob([response.data]), fileName)
  } catch (error) {
    alert('下載失敗')
    console.error(error)
  } finally {
    isDownloadingInvoice.value = false
  }
}
const downloadFile = (blob, fileName) => {
  // 動態建立 <a> 標籤
  const link = document.createElement('a')
  // 設置下載鏈接 blobURL
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  //添加到 DOM 並觸發點擊
  document.body.append(link)
  link.click()
  link.remove()
  // 釋放資源
  setTimeout(() => URL.revokeObjectURL(link.href), 7000)
}

function isDesktopBrowser() {
  // 檢查是否為桌面瀏覽器
  const userAgent = navigator.userAgent.toLowerCase()
  return !/mobile|android|iphone|ipad|tablet/.test(userAgent)
}
async function downloadAllAccountStatements() {
  if (!isDesktopBrowser()) {
    alert('一鍵下載僅支援電腦版')
    return
  }
  isdownloadingAccountStatement.value = true
  try {
    const promises = reconciliationAndInvoice_list.value.map((account) =>
      downloadAccountStatement(account.account_sortId, account.acc_name)
    )
    await Promise.all(promises)
    alert('全部總表下載完成')
  } catch (error) {
    alert('下載全部總表時發生錯誤')
    console.error(error)
  } finally {
    isdownloadingAccountStatement.value = false
  }
}
async function downloadAllAccountDetails() {
  if (!isDesktopBrowser()) {
    alert('一鍵下載僅支援電腦版')
    return
  }
  isdownloadingAccountDetails.value = true
  try {
    const promises = reconciliationAndInvoice_list.value.map((account) =>
      downloadAccountDetails(account.account_sortId, account.acc_name)
    )
    await Promise.all(promises)
    alert('全部明細下載完成')
  } catch (error) {
    alert('下載全部明細時發生錯誤')
    console.error(error)
  } finally {
    isdownloadingAccountDetails.value = false
  }
}
async function downloadAllInvoice() {
  if (!isDesktopBrowser()) {
    alert('一鍵下載僅支援電腦版')
    return
  }
  isDownloadingInvoice.value = true
  try {
    // 將所有需要下載的請求收集到 promises 陣列中
    const promises = [];
    reconciliationAndInvoice_list.value.forEach((account) => {
      account.invoiceNums.forEach((invoiceNum) => {
        promises.push(
          downloadInvoice(account.account_sortId, account.acc_name, invoiceNum)
        );
      });
    });

    // 等待所有下載完成
    await Promise.all(promises);
    alert('全部發票下載完成');
  } catch (error) {
    alert('下載全部發票時發生錯誤')
    console.error(error)
  } finally {
    isDownloadingInvoice.value = false
  }
}
async function share() {
  const url = window.location.href // 當前頁面網址
  const title = document.title // 當前頁面的標題

  // 檢查是否支持 Web Share API
  if (navigator.share) {
    navigator
      .share({
        title: title,
        url: url
      })
      .catch((error) => {
        alert('分享失敗')
        console.error('分享失敗', error)
      })
  } else {
    // 使用 Line 分享的方式
    const lineShareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}?openExternalBrowser=1`
    // 在新標籤中打開 Line 分享頁面
    window.open(lineShareUrl, '_blank')
  }
}
</script>

<template>
  <div class="container mt-5">
    <h4>
      {{ cus_name }}
    </h4>
    <h4>帳單期別：{{ search_month }}</h4>
    <p class="text-danger">一鍵下載僅支援電腦版</p>
    <div class="d-flex flex-nowrap justify-content-md-end justify-content-sm-center gap-1 mb-2">
      <button class="btn btn-sm btn-yellow text-nowrap" @click="downloadAllAccountStatements">
        一鍵下載總表
      </button>
      <button class="btn btn-sm btn-yellow text-nowrap" @click="downloadAllAccountDetails">
        一鍵下載明細
      </button>
      <button class="btn btn-sm btn-yellow text-nowrap" @click="downloadAllInvoice">
        一鍵下載發票
      </button>
      <button class="btn btn-sm btn-yellow text-nowrap" @click="share">分享</button>
    </div>
    <div
      element-loading-text="資料載入中...請稍候"
      :element-loading-spinner="svg"
      v-loading.fullscreen="isGettingCompanyInfo"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    ></div>
    <div
      element-loading-text="下載發票中..."
      :element-loading-spinner="svg"
      v-loading.fullscreen="isDownloadingInvoice"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    ></div>
    <div
      element-loading-text="下載對帳單總表中..."
      :element-loading-spinner="svg"
      v-loading.fullscreen="isdownloadingAccountStatement"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    ></div>
    <div
      element-loading-text="下載對帳單明細中..."
      :element-loading-spinner="svg"
      v-loading.fullscreen="isdownloadingAccountDetails"
      element-loading-svg-view-box="-10, -10, 50, 50"
      element-loading-background="rgba(122, 122, 122, 0.8)"
    ></div>
    <div class="mb-5">
      <el-table
        :data="reconciliationAndInvoice_list"
        v-loading="isGettingCompanyInfo || isChecking || isLoadingReconciliationAndInvoice_list || isLoadingInvoiceList"
      >
        <el-table-column
          prop="acc_name"
          label="帳單名稱"
          align="center"
          min-width="180"
        ></el-table-column>
  
        <el-table-column prop="account_sortId" label="帳單總表" align="center" min-width="120">
          <template #default="{ row }">
            <a class="pointer" @click="downloadAccountStatement(row.account_sortId, row.acc_name)">
              <button class="btn btn-yellow">總表</button>
            </a>
          </template>
        </el-table-column>
  
        <el-table-column prop="account_sortId" label="帳單明細" align="center" min-width="120">
          <template #default="{ row }">
            <a class="pointer" @click="downloadAccountDetails(row.account_sortId, row.acc_name)">
              <button class="btn btn-yellow">明細</button>
            </a>
          </template>
        </el-table-column>
  
        <el-table-column prop="發票" label="發票" align="center" min-width="140">
          <template #default="{ row }">
            <a v-if="row.invoiceNums && row.invoiceNums.length > 0" class="pointer">
              <div class="d-flex flex-column gap-1 align-items-center">
                <button class="btn btn-yellow" v-for="(invoiceNum, index) in row.invoiceNums"
                :key="index">
                  <span @click="downloadInvoice(row.account_sortId, row.acc_name, invoiceNum)">{{ invoiceNum }}</span>
                </button>
              </div>
            </a>
            <span v-else></span>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<style scoped>
.pointer {
  cursor: pointer;
}
</style>
