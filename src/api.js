import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://122.116.23.30:3346'

const apiClient = axios.create({
  baseURL: apiUrl
})

export default apiClient
