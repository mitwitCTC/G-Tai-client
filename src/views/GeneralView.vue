<script setup>
import { ref } from 'vue'
const company_info = ref([
  {
    customerId: '123',
    customerName: '測試有限公司',
    vat_number: '12345678',
    contact_name: '陳經理',
    contact_tel: '02-12345678',
    contact_phone: '0909-123456',
    billing_contact: '林經理',
    billing_contact_phone: '0909-123123',
    settlement_data_email: 'test@gmail.com',
    communication_address: '台北市中山區興安街',
    fax_number: '',
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
    contact_name: '聯絡人姓名',
    contact_tel: '聯絡人電話',
    contact_phone: '聯絡人手機',
    billing_contact: '開立發票聯絡人',
    billing_contact_phone: '發票聯絡人電話',
    settlement_data_email: '結算資料Email',
    communication_address: '聯絡地址',
    fax_number: '傳真號碼',
    Insufficient_Balance_SMS: '餘額不足簡訊',
    subsidiary: '子公司統編/名稱'
  }
  return labels[key] || key
}

<template>
  <div class="container mt-5">
    <router-link to="/">
      <button class="btn btn-outline-warning mb-2">回首頁</button>
    </router-link>
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
            <span v-else>{{ value }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
