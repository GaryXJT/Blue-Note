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
  return request<
    AxiosResponse<
      ApiResponse<{
        notifications: Notification[];
        total: number;
      }>
    >
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
