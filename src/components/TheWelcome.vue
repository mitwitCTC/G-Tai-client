<script setup>
import { useCompanyStore } from '@/stores/companyStore'
import router from '@/router'
import { ref, onMounted, watch, reactive } from 'vue'
import { ElLoading } from 'element-plus'
// API 根路由
import apiClient from '@/api' // 載入 apiClient

const navItems = ref([
  {
    name: '客戶資料',
    path: '/general',
    icon_path: 'bi bi-file-earmark-text'
  },
  {
    name: '加油紀錄',
    path: '/fuel-record',
    icon_path: 'bi bi-fuel-pump'
  },
  {
    name: '匯款紀錄',
    path: '/transfer-record',
    icon_path: 'bi bi-cash-coin'
  },
  {
    name: '對帳及發票查詢',
    path: '/reconciliation-invoice',
    icon_path: 'bi bi-card-checklist'
  }
])
const companyStore = useCompanyStore()
const company_info = ref({ customerId: '', customerName: '' })
let loadingInstance = null
function fetchCompanyInfo() {
  // 顯示 loading 遮罩
  loadingInstance = ElLoading.service({
    fullscreen: true,
    text: '載入中...',
    background: 'rgba(0, 0, 0, 0.5)'
  })

  const storedInfo = sessionStorage.getItem('company_info')
  if (storedInfo) {
    company_info.value = JSON.parse(storedInfo)
    setTimeout(() => {
      loadingInstance.close()
    }, 1000)
  } else {
    watch(
      () => companyStore.company_info,
      (newInfo) => {
        if (newInfo.customerName) {
          company_info.value = newInfo
          sessionStorage.setItem('company_info', JSON.stringify(newInfo))
          setTimeout(() => {
            loadingInstance.close()
          }, 1000)
        }
      },
      { immediate: true }
    )
  }
}
onMounted(() => {
  fetchCompanyInfo()
})

function logout() {
  sessionStorage.clear()
  router.push('/login')
}

// 修改密碼
const updatePassworForm = ref({
  cus_code: '',
  front_pwd: '',
  newfront_pwd: '',
  newfront_pwd_check: ''
})
onMounted(() => {
  updatePassworForm.value.cus_code = company_info.value.customerId
})
const updatePasswordDialogVisible = ref(false)
// 表單驗證規則
const rules = reactive({
  front_pwd: [{ required: true, message: '此欄位為必填', trigger: 'blur' }],
  newfront_pwd: [
    { required: true, message: '此欄位為必填', trigger: 'blur' },
    { validator: validatePasswordNotSameAsOld, trigger: 'blur' },
    { min: 6, message: '至少需要 6 個英文或數字' }
  ],
  newfront_pwd_check: [
    { required: true, message: '此欄位為必填', trigger: 'blur' },
    { validator: validateNewPassword, trigger: 'blur' }
  ]
})
// 密碼確認的規則
function validateNewPassword(rule, value, callback) {
  if (value !== updatePassworForm.value.newfront_pwd) {
    callback(new Error('新密碼與確認密碼不一致'))
  } else {
    callback()
  }
}
function validatePasswordNotSameAsOld(rule, value, callback) {
  if (value == updatePassworForm.value.front_pwd) {
    callback(new Error('新密碼不得與原密碼相同'))
  } else {
    callback()
  }
}
const updatePassword_result = ref('')
function setUpdatePasswordResult(message) {
  updatePassword_result.value = message
  setTimeout(() => {
    updatePassword_result.value = ''
  }, 3000)
}

function resetUpdatePasswordResult() {
  setTimeout(() => {
    updatePassword_result.value = ''
  }, 3000)
}

const ruleFormRef = ref(null)
async function submitForm() {
  ruleFormRef.value.validate(async (valid) => {
    if (valid) {
      const response = await apiClient.post('/main/updatePassword', {
        cus_code: updatePassworForm.value.cus_code,
        front_pwd: updatePassworForm.value.front_pwd,
        newfront_pwd: updatePassworForm.value.newfront_pwd
      })
      try {
        if (response.data.returnCode == 0) {
          setUpdatePasswordResult(response.data.message)
          setTimeout(() => {
            console.clear()
            logout()
          }, 2000)
        } else if (response.data.returnCode == -1) {
          setUpdatePasswordResult(response.data.message)
        } else {
          console.error(response.data)
        }
      } catch (error) {
        console.error(error)
      }
    } else {
      return false
    }
  })
  resetUpdatePasswordResult()
}
</script>

<template>
  <div class="container">
    <div class="company-info mt-5 d-flex justify-content-between align-itemns-center">
      <h3>
        {{ company_info.customerName }}
        <span v-if="company_info.customerId">({{ company_info.customerId }})</span>
      </h3>
      <button class="btn btn-yellow" @click="logout">登出</button>
    </div>
    <ul class="nav-list mt-5">
      <li class="item" v-for="(item, index) in navItems" :key="index">
        <router-link :to="item.path">
          <div class="nav-body">
            <i :class="item.icon_path" class="nav-icon"></i>
            <p class="nav-text">{{ item.name }}</p>
          </div>
        </router-link>
      </li>
      <li class="item">
        <a href="https://page.line.me/a42993157?openQrModal=true">
          <div class="nav-body">
            <i class="bi bi-line"></i>
            <p class="nav-text">官方 Line</p>
          </div>
        </a>
      </li>
      <li class="item pointer">
        <div class="nav-body" @click="updatePasswordDialogVisible = true">
          <i class="bi bi-shield-lock"></i>
          <p class="nav-text">變更密碼</p>
        </div>
      </li>
    </ul>
    <el-dialog v-model="updatePasswordDialogVisible" title="變更密碼" width="500" align-center>
      <el-alert
        v-if="updatePassword_result"
        :title="updatePassword_result"
        :type="updatePassword_result == '修改密碼成功' ? 'success' : 'error'"
        show-icon
      />
      <el-form
        ref="ruleFormRef"
        :model="updatePassworForm"
        :rules="rules"
        label-width="auto"
        status-icon
        @keydown.enter.prevent
      >
        <el-form-item label="客戶代號" prop="cus_code">
          <el-input disabled v-model="updatePassworForm.cus_code" type="text" />
        </el-form-item>
        <el-form-item label="原密碼" prop="front_pwd">
          <el-input
            v-model="updatePassworForm.front_pwd"
            type="password"
            placeholder="請輸入原密碼"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密碼" prop="newfront_pwd">
          <el-input
            v-model="updatePassworForm.newfront_pwd"
            type="password"
            placeholder="請輸入新密碼"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密碼確認" prop="newfront_pwd_check">
          <el-input
            v-model="updatePassworForm.newfront_pwd_check"
            type="password"
            placeholder="請再次輸入新密碼確認"
            show-password
            @keyup.enter="submitForm(updatePassworForm)"
          />
        </el-form-item>
        <div class="d-flex justify-content-end gap-3">
          <button class="btn btn-outline-secondary" @click="updatePasswordDialogVisible = false">
            取消
          </button>
          <button class="btn btn-warning text-white" @click="submitForm(updatePassworForm)">
            確認修改
          </button>
        </div>
      </el-form>
    </el-dialog>
  </div>
</template>

<style scoped>
.nav-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.item {
  flex: 1 1 20%; /* Allow items to grow/shrink with a base width of 20% */
  min-width: 150px;
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ddd;
  box-shadow: rgba(99, 99, 99, 0.2) 0px 2px 8px 0px;
  border-radius: 8px;
  background: #fff;
  transition: transform 0.2s;
}

.item:hover {
  transform: scale(1.05);
  background: #fcd25d;
  box-shadow: rgba(99, 99, 99, 0.5) 0px 2px 8px 0px;
}

.nav-body {
  padding: 15px;
  text-align: center;
}

.nav-icon {
  font-size: 24px;
  margin-bottom: 10px;
}

.nav-text {
  margin: 10px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pointer {
  cursor: pointer;
}
</style>
