import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export const useSearchAccountStore = defineStore('searchAccount', () => {
  // 從 sessionStorage 讀取資料，如果沒有則返回空對象
  const storedInfo = JSON.parse(sessionStorage.getItem('searchAccount_info')) || {}
  const searchAccount = ref(storedInfo)

  // 更新公司資訊，並將其保存到 sessionStorage
  function setSearchAccount(info) {
    searchAccount.value = info
  }

  // 監聽 company_info 的變化，將其自動保存到 sessionStorage
  watch(
    searchAccount,
    (newInfo) => {
      sessionStorage.setItem('searchAccount_info', JSON.stringify(newInfo))
    },
    { deep: true }
  )

  return {
    searchAccount,
    setSearchAccount
  }
})
