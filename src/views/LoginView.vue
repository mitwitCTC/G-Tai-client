<script setup>
import { ref } from 'vue'

const loginForm = ref({
  account: '',
  password: ''
})

function submitForm() {
  console.log(loginForm.value)
}
</script>

<template>
  <div class="container d-flex justify-content-center">
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
