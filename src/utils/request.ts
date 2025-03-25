import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { message } from 'antd'
import { API_BASE_URL, API_CONFIG } from '../config/api'

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  ...API_CONFIG,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message: msg, data } = response.data
    if (code === 200) {
      return data
    }
    message.error(msg || '请求失败')
    return Promise.reject(new Error(msg || '请求失败'))
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未认证，清除token并跳转到登录页
          localStorage.removeItem('token')
          window.location.href = '/login'
          break
        case 403:
          message.error('没有权限访问')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器错误')
          break
        default:
          message.error(error.response.data.message || '请求失败')
      }
    } else {
      message.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

// 封装请求方法
const http = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return request.get(url, config)
  },

  post: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return request.post(url, data, config)
  },

  put: <T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> => {
    return request.put(url, data, config)
  },

  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return request.delete(url, config)
  },
}

export default http
