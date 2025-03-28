import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

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
}

// 创建响应数据接口
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

// 创建Axios实例
const instance: AxiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://gxzkgaibncip.sealoshzh.site/api/v1", // API基础URL
  timeout: 10000, // 请求超时时间
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器
instance.interceptors.request.use(
  (config: InternalAxiosRequestConfig<any>) => {
    // 获取token（如果有的话）
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
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
          localStorage.removeItem("token");

          // 只有当当前路径不是根路径时才跳转
          if (window.location.pathname !== "/") {
            window.location.href = "/";
          }
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

    return await instance.request<any, T>(axiosConfig as AxiosRequestConfig);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(-3, "请求失败，请稍后重试");
  }
};

export default instance;
