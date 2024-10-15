import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useCompanyStore = defineStore('company', () => {
  // 從 sessionStorage 讀取資料，如果沒有則返回空對象
  const storedInfo = JSON.parse(sessionStorage.getItem('company_info')) || {}
  const company_info = ref(storedInfo)

  // 更新公司資訊，並將其保存到 sessionStorage
  function setCompanyInfo(info) {
    company_info.value = info
  }

  // 監聽 company_info 的變化，將其自動保存到 sessionStorage
  watch(
    company_info,
    (newInfo) => {
      sessionStorage.setItem('company_info', JSON.stringify(newInfo))
    },
    { deep: true }
  )

  return {
    company_info,
    setCompanyInfo
  }
})
