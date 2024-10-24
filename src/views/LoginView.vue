<script setup>
import router from '@/router'
import { ref } from 'vue'
import { useCompanyStore } from '@/stores/companyStore'
const companyStore = useCompanyStore()

const loginForm = ref({
  account: '',
  password: ''
})
const login_result = ref('')
const customerId = ref('')

// API 根路由
import apiClient from '@/api' // 載入 apiClient
import apiServer from '@/apiServer' // 載入 apiServer

async function submitForm() {
  try {
    const { account, password } = loginForm.value
    const response = await apiClient.post('/main/logIn', {
      vat_number: account,
      front_pwd: password
    })

    const { returnCode, message, data } = response.data

    if (returnCode === 0) {
      const { contract_status, cus_code, transaction_mode } = data[0]
      if (contract_status !== 'Y') {
        login_result.value = '登入成功'
        customerId.value = cus_code
        setCompanyInfo()
        sessionStorage.setItem('token', transaction_mode)
        router.push('/')
      } else {
        setLoginResult('登入失敗')
      }
    } else {
      setLoginResult(message)
    }
  } catch (error) {
    console.error(error)
  }
  resetLoginResult()
}

function setLoginResult(message) {
  login_result.value = message
  setTimeout(() => {
    login_result.value = ''
  }, 2000)
}

function resetLoginResult() {
  setTimeout(() => {
    login_result.value = ''
  }, 2000)
}

const company_info = ref({})
async function setCompanyInfo() {
  try {
    const response = await apiServer.post('/main/searchCustomer', {
      cus_code: customerId.value
    })
    company_info.value.customerId = response.data.data[0].cus_code
    company_info.value.customerName = response.data.data[0].company_title
    companyStore.setCompanyInfo(company_info.value)
  } catch (error) {
    console.error(error)
  }
}
</script>

<template>
  <el-alert
    v-if="login_result"
    :title="login_result"
    :type="login_result == '登入成功' ? 'success' : 'error'"
    show-icon
    class="position-absolute"
  />
  <div class="container position-relative d-flex justify-content-center">
    <div class="login-form mt-5 w-50">
      <h1 class="text-center my-3">鉅泰創新</h1>
      <div class="d-flex justify-content-center">
        <el-form ref="loginFormRef" :model="loginForm">
          <el-form-item label="帳號" prop="account">
            <el-input v-model="loginForm.account" type="text" autocomplete="off" />
          </el-form-item>
          <el-form-item label="密碼" prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              autocomplete="off"
              @keydown.enter="submitForm(loginFormRef)"
            />
          </el-form-item>
          <el-form-item>
            <div class="w-100 text-center">
              <button type="button" class="btn btn-warning" @click="submitForm(loginFormRef)">
                登入
              </button>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-form {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
  padding: 15px;
}
</style>
