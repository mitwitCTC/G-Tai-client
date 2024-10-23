<script setup>
import { onMounted, ref } from 'vue'
import router from '@/router'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()

// API 根路由
import apiServer from '@/apiServer' // 載入 apiServer
const company_info = ref({})
async function getCompany_info() {
  try {
    const response = await apiServer.post('/main/searchCustomer', {
      cus_code: companyStore.company_info.customerId
    })
    company_info.value.customerId = response.data.data[0].cus_code
    company_info.value.customerName = response.data.data[0].company_title
    company_info.value.vat_number = response.data.data[0].vat_number
    company_info.value.company_tel = response.data.data[0].phone
    company_info.value.fax_number = response.data.data[0].fax
    company_info.value.delivery_address = response.data.data[0].mail_address
  } catch (error) {
    console.error(error)
  }
}
onMounted(() => {
  getCompany_info()
})
function formatLabel(key) {
  const labels = {
    customerId: '客戶代號',
    customerName: '客戶名稱',
    vat_number: '統一編號',
    company_tel: '公司電話',
    fax_number: '傳真電話',
    delivery_address: '郵寄地址'
  }
  return labels[key] || key
}

// 聯絡人資料
const contactData = ref([])
async function getContactData() {
  contactData.value = [
    {
      job_title: '承辦',
      name: '鄭吉峰',
      mobile: '0977-090-030',
      mail: 'subal.bus@gmail.com',
      notes: ''
    },
    {
      job_title: '會計',
      name: '賴小姐',
      mobile: '0980-063-217',
      mail: 'subal.bus@gmail.com',
      notes: ''
    }
  ]
}
onMounted(() => {
  getContactData()
})

// 分公司資料
const subsidiaryData = ref([])
async function getSubsidiaryData() {
  subsidiaryData.value = [
    {
      name: '八達通遊覽車客運有限公司',
      vat_number: '89290241'
    },
    {
      name: '日星交通事業有限公司',
      vat_number: '12130252'
    },
    {
      name: '永青遊覽有限公司',
      vat_number: '4995964'
    }
  ]
}
onMounted(() => {
  getSubsidiaryData()
})

const all_vehicle_status = ref([
  {
    status_des: '申請中油車隊卡',
    icon_path: './vehicle_status/1.png'
  },
  {
    status_des: '送出申請中油車隊卡',
    icon_path: './vehicle_status/2.png'
  },
  {
    status_des: '中油車隊卡製卡中',
    icon_path: './vehicle_status/3.png'
  },
  {
    status_des: '中油清點中油車隊卡',
    icon_path: './vehicle_status/4.png'
  },
  {
    status_des: '鉅泰寄出中油車隊卡',
    icon_path: './vehicle_status/5.png'
  },
  {
    status_des: '掛號單號查詢',
    icon_path: './vehicle_status/6.png'
  }
])

const vehicle_status = ref(Math.floor(Math.random() * all_vehicle_status.value.length))

// 登出
function logout() {
  sessionStorage.removeItem('token')
  router.push('/login')
}
</script>

<template>
  <div class="container mt-5">
    <div class="d-flex justify-content-between align-items-center">
      <router-link to="/">
        <button class="btn btn-yellow mb-2">回首頁</button>
      </router-link>
      <button class="btn btn-yellow" @click="logout">登出</button>
    </div>
    <!-- 客戶基本資料表 -->
    <table class="table">
      <tbody v-for="(item, index) in [company_info]" :key="index">
        <tr v-for="(value, key) in item" :key="key">
          <td>{{ formatLabel(key) }}</td>
          <td>
            <span>{{ value }}</span>
          </td>
        </tr>
      </tbody>
    </table>
    <hr />
    <!-- 客戶聯絡人表 -->
    <el-table :data="contactData">
      <el-table-column align="center" prop="job_title" label="職稱" />
      <el-table-column align="center" prop="name" label="聯絡人姓名" />
      <el-table-column align="center" prop="mobile" label="聯絡人電話" />
      <el-table-column align="center" prop="mail" label="聯絡人信箱" min-width="130" />
      <el-table-column align="center" prop="notes" label="備註" />
    </el-table>
    <hr />
    <!-- 分公司資料表 -->
    <el-table :data="subsidiaryData">
      <el-table-column align="center" prop="name" label="分公司名稱" />
      <el-table-column align="center" prop="vat_number" label="統一編號" />
    </el-table>
    <hr />
    <h2>車籍異動狀態</h2>
    <div id="vehicle-status" class="mt-5">
      <ul class="d-flex gap-5 justify-content-center align-items-center flex-wrap">
        <li
          v-for="(item, index) in all_vehicle_status"
          :key="index"
          :class="{
            'opacity-100': index === vehicle_status,
            'opacity-50': index !== vehicle_status
          }"
          class="d-flex flex-column align-items-center position-relative"
        >
          <img class="vehicle-status-img" :src="item.icon_path" alt="vehicle-status" />
          <p>{{ item.status_des }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.vehicle-status-img {
  width: 10vw;
  aspect-ratio: 1/1.1;
}
@media (max-width: 576px) {
  .vehicle-status-img {
    height: 15vw;
  }
}
</style>
