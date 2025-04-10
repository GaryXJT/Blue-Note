import { request, ApiResponse } from "../axios";
import { AxiosResponse } from "axios";

// 验证码返回数据接口
export interface CaptchaResponse {
  captcha_id: string;
  captcha_image: string;
}

// 登录响应数据接口
export interface LoginResponse {
  token: string;
  user_id: string;
  username: string;
  role: string;
}

// 获取验证码API
export const getCaptcha = (): Promise<AxiosResponse<CaptchaResponse>> => {
  return request<AxiosResponse<CaptchaResponse>>({
    url: "/auth/captcha",
    method: "GET",
  });
};

// 用户登录/注册API
export const loginOrRegister = (data: {
  username: string;
  password: string;
  captchaId: string;
  captchaCode: string;
}): Promise<AxiosResponse<ApiResponse<LoginResponse>>> => {
  return request<AxiosResponse<ApiResponse<LoginResponse>>>({
    url: "/auth/login",
    method: "POST",
    data: {
      username: data.username,
      password: data.password,
      captchaId: data.captchaId,
      captchaCode: data.captchaCode,
    },
  });
};

// 修改密码API
export const changePassword = (data: {
  username: string;
  oldPassword: string;
  newPassword: string;
  captchaId: string;
  captchaCode: string;
}): Promise<AxiosResponse<ApiResponse<any>>> => {
  return request<AxiosResponse<ApiResponse<any>>>({
    url: "/auth/change-password",
    method: "POST",
    data: {
      username: data.username,
      oldPassword: data.oldPassword,
      newPassword: data.newPassword,
      captchaId: data.captchaId,
      captchaCode: data.captchaCode,
    },
  });
};
