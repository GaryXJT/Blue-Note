import { request } from '../axios'
import { AxiosResponse } from 'axios'

// 验证码返回数据接口
export interface CaptchaResponse {
  captcha_id: string
  captcha_image: string
}

// 登录响应数据接口
export interface LoginResponse {
  token: string
  user_id: string
  username: string
  role: string
}

// 获取验证码API
export const getCaptcha = () => {
  return request<CaptchaResponse>({
    url: '/auth/captcha',
    method: 'GET'
  })
}

// 用户登录API
export const login = (data: {
  username: string
  password: string
  captchaId: string
  captchaCode: string
}) => {
  return request<LoginResponse>({
    url: '/auth/login',
    method: 'POST',
    data: {
      username: data.username,
      password: data.password,
      captcha_id: data.captchaId,
      captcha_code: data.captchaCode
    }
  })
}

// 用户注册API
export const register = (data: {
  username: string
  password: string
  captchaId: string
  captchaCode: string
}) => {
  return request<LoginResponse>({
    url: '/auth/register',
    method: 'POST',
    data: {
      username: data.username,
      password: data.password,
      captcha_id: data.captchaId,
      captcha_code: data.captchaCode
    }
  })
} 