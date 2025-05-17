import { request } from "../axios";
import { AxiosResponse } from "axios";
import { ApiResponse } from "../axios";
import { Notification } from "../types";

// 获取通知列表
export const getNotifications = (params?: {
  userId?: string;
  page?: number;
  limit?: number;
}) => {
  // 确保有userId参数
  if (!params?.userId) {
    console.error("获取通知需要userId参数");
    return Promise.reject(new Error("获取通知需要userId参数"));
  }

  console.log("开始请求通知API, 参数:", params);

  return request<
    AxiosResponse<{
      list: [];
      total: number;
    }>
  >({
    url: "/notifications",
    method: "GET",
    params,
  });
};

// 获取未读通知数量
export const getUnreadCount = () => {
  return request<AxiosResponse<ApiResponse<{ count: number }>>>({
    url: "/notifications/unread/count",
    method: "GET",
  });
};

// 更新通知状态（标记为已读）
export const updateNotification = (id: string) => {
  return request<AxiosResponse<ApiResponse<{ success: boolean }>>>({
    url: `/notifications/${id}`,
    method: "PUT",
  });
};

// 删除通知
export const deleteNotification = (id: string) => {
  return request<AxiosResponse<ApiResponse<{ success: boolean }>>>({
    url: `/notifications/${id}`,
    method: "DELETE",
  });
};

// 标记所有通知为已读
export const markAllAsRead = () => {
  return request<AxiosResponse<ApiResponse<{ success: boolean }>>>({
    url: "/notifications/read/all",
    method: "PUT",
  });
};
