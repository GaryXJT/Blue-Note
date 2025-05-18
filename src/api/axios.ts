import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import config from "@/config";

// 创建自定义错误类
export class ApiError extends Error {
  constructor(public code: number, public message: string, public data?: any) {
    super(message);
    this.name = "ApiError";
  }
}

// 创建请求配置接口，继承自AxiosRequestConfig而不是扩展它
export interface RequestConfig {
  url?: string;
  method?: string;
  baseURL?: string;
  headers?: Record<string, string>;
  params?: any;
  data?: any;
  timeout?: number;
  loading?: boolean; // 是否显示加载状态
  skipErrorHandler?: boolean; // 是否跳过错误处理
  onUploadProgress?: (event: ProgressEvent) => void; // 上传进度回调
}

// 创建响应数据接口
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 创建Axios实例
const instance: AxiosInstance = axios.create({
  baseURL: config.api.baseURL, // 使用配置文件中的API基础URL
  timeout: config.api.timeout, // 使用配置文件中的超时时间
  withCredentials: config.api.withCredentials, // 使用配置文件中的withCredentials设置
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (axiosConfig: InternalAxiosRequestConfig<any>) => {
    // 获取token（如果有的话）
    const token = localStorage.getItem(config.cache.tokenKey); // 使用配置文件中的tokenKey
    if (token) {
      axiosConfig.headers = axiosConfig.headers || {};
      axiosConfig.headers.Authorization = `Bearer ${token}`;
    }
    return axiosConfig;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 直接返回响应数据，不做处理
    return response;
  },
  (error) => {
    if (error.response) {
      // 请求已发出，但服务器响应的状态码不在 2xx 范围内
      const { status, data } = error.response;
      switch (status) {
        case 401:
          // 未授权，清除token
          // localStorage.removeItem("token");
          // localStorage.removeItem(config.cache.tokenKey);

          // 只有当当前路径不是根路径时才跳转
          // if (window.location.pathname !== "/") {
          //   window.location.href = "/";
          // }
          break;
        case 403:
          // 权限不足
          console.error("权限不足");
          break;
        case 404:
          // 请求的资源不存在
          console.error("请求的资源不存在");
          break;
        case 500:
          // 服务器错误
          console.error("服务器错误");
          break;
        default:
          console.error(`未知错误: ${status}`);
      }
      return Promise.reject(
        new ApiError(status, data.message || "请求失败", data)
      );
    }
    if (error.request) {
      // 请求已发出，但没有收到响应
      return Promise.reject(new ApiError(-1, "网络错误，请检查网络连接"));
    }
    // 请求配置出错
    return Promise.reject(new ApiError(-2, error.message));
  }
);

// 封装请求方法
export const request = async <T = any>(config: RequestConfig): Promise<T> => {
  try {
    const { loading, skipErrorHandler, ...axiosConfig } = config;

    // 将axiosConfig作为AxiosRequestConfig传递，保留所有属性包括onUploadProgress
    return await instance.request<any, T>(axiosConfig as AxiosRequestConfig);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(-3, "请求失败，请稍后重试");
  }
};

export default instance;
