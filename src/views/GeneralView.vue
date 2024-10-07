<script setup>
import { ref } from 'vue'
import router from '@/router'
const company_info = ref([
  {
    customerId: 'G2200756',
    customerName: '捷乘交通有限公司',
    vat_number: '75939529',
    company_tel: '02-12345678',
    fax_number: '02-12341234',
    contact_name: '陳經理',
    contact_tel: '0909-123456',
    auditor_name: '林經理',
    auditor_phone: '02-11112222',
    email: 'test@gmail.com',
    delivery_address: '900屏東縣屏東市迪化街29號',
    Insufficient_Balance_SMS: false,
    subsidiary: [
      {
        vat_number: '11111111',
        name: '測試子公司一'
      },
      {
        vat_number: '22222222',
        name: '測試子公司二'
      }
    ]
  }
])
function formatLabel(key) {
  const labels = {
    customerId: '客戶編號',
    customerName: '客戶名稱',
    vat_number: '統一編號',
    company_tel: '公司電話',
    fax_number: '傳真電話',
    contact_name: '承辦窗口',
    contact_tel: '承辦電話',
    auditor_name: '帳務窗口',
    auditor_phone: '帳務電話',
    email: 'E-MAIL',
    delivery_address: '郵寄地址',
    Insufficient_Balance_SMS: '餘額不足通知',
    subsidiary: '分公司使用單位/統編'
  }
  return labels[key] || key
}

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
        <button class="btn btn-outline-warning mb-2">回首頁</button>
      </router-link>
      <button class="btn btn-outline-warning" @click="logout">登出</button>
    </div>
    <table class="table">
      <tbody v-for="(item, index) in company_info" :key="index">
        <tr v-for="(value, key) in item" :key="key">
          <td>{{ formatLabel(key) }}</td>
          <td>
            <span v-if="Array.isArray(value)">
              <ul>
                <li v-for="(sub, subIndex) in value" :key="subIndex">
                  統編：{{ sub.vat_number }}
                  <br />
                  {{ sub.name }}
                </li>
              </ul>
            </span>
            <span v-else>
              <span v-if="key === 'Insufficient_Balance_SMS'">
                {{ value ? '是' : '否' }}
              </span>
              <span v-else>{{ value }}</span>
            </span>
          </td>
        </tr>
      </tbody>
    </table>
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
