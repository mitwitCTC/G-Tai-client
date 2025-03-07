import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://jutai.mitwit-cre.com.tw/apiServer'

const apiServer = axios.create({
  baseURL: apiUrl
})

export default apiServer
