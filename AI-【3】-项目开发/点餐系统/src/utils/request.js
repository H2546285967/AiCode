import axios from 'axios'
import { ElMessage } from 'element-plus'

const request = axios.create({ baseURL: '/api', timeout: 10000 })

request.interceptors.request.use(config => {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('adminToken')
      ElMessage.error('登录已过期，请重新登录')
      window.location.href = '/home'
    }
    return Promise.reject(err)
  }
)

export default request
