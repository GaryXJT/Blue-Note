import { request } from "../axios";
import { AdminStats, PendingPost } from "../types";
import { AxiosResponse } from "axios";
import { ApiResponse } from "../axios";

// 获取统计数据
export const getStats = () => {
  return request<AdminStats>({
    url: "/admin/stats",
    method: "GET",
  });
};

// 获取待审核帖子
export const getPendingPosts = (params?: { page?: number; limit?: number }) => {
  return request<{ posts: PendingPost[]; total: number }>({
    url: "/admin/pending-posts",
    method: "GET",
    params,
  });
};

// 审核帖子
export const reviewPost = (
  postId: string,
  data: {
    status: "approved" | "rejected";
    reason?: string;
  }
) => {
  return request({
    url: `/admin/posts/${postId}/review`,
    method: "PUT",
    data,
  });
};

// 获取用户列表
export const getUsers = async (params: {
  page: number;
  limit: number;
  search?: string;
}) => {
  return request<
    AxiosResponse<
      ApiResponse<{
        list: Array<{
          userId: string;
          username: string;
          nickname: string;
          avatar: string;
          bio: string;
          status: "active" | "blocked";
          role: "user" | "admin";
          createdAt: string;
        }>;
        total: number;
      }>
    >
  >({
    url: "admin/users",
    method: "GET",
    params,
  });
};

// 设置用户角色
export const setUserRole = async (userId: string, role: string) => {
  return request({
    url: `/admin/users/${userId}/role/${role}`,
    method: "PUT",
  });
};

// 删除用户
export const deleteUser = async (userId: string) => {
  return request({
    url: `/admin/users/${userId}`,
    method: "DELETE",
  });
};
