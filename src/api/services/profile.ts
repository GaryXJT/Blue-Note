import { request } from "../axios";
import { UserInfo, User } from "@/api/types";
import { AxiosResponse } from "axios";
import config from "@/config";

// 获取指定用户的个人资料
export const getUserProfile = (userId: string) => {
  return request<AxiosResponse<UserInfo>>({
    url: `/users/profile/${userId}`,
    method: "GET",
  });
};

// 更新用户个人资料
export const updateUserProfile = (data: {
  username?: string;
  nickname?: string;
  avatar?: string | File; // 允许传入头像文件或URL字符串
  bio?: string;
  gender?: "male" | "female" | "other";
  birthday?: string;
  location?: string;
  status?: string;
}) => {
  // 检查是否有头像文件需要上传
  if (data.avatar instanceof File) {
    // 使用FormData提交，支持文件上传
    const formData = new FormData();

    // 添加头像文件
    formData.append("avatar", data.avatar);

    // 添加其他个人资料字段
    Object.entries(data).forEach(([key, value]) => {
      // 跳过头像，因为已经添加过了
      if (key !== "avatar" && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // 获取token
    const token = localStorage.getItem(config.cache.tokenKey);

    // 发送含有文件的FormData请求
    return request<AxiosResponse<User>>({
      url: "/users/profile",
      method: "PUT",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } else {
    // 获取token
    const token = localStorage.getItem(config.cache.tokenKey);

    // 常规JSON请求 (当avatar是URL字符串或未定义时)
    return request<AxiosResponse<User>>({
      url: "/users/profile",
      method: "PUT",
      data,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }
};

// 上传头像 (保留此方法以兼容旧代码，但优先考虑使用updateUserProfile)
export const uploadAvatar = (avatarFile: File) => {
  const formData = new FormData();
  formData.append("avatar", avatarFile);

  return request<AxiosResponse<{ avatarUrl: string }>>({
    url: "/users/avatar",
    method: "POST",
    data: formData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 关注用户
export const followUser = (userId: string) => {
  return request<
    AxiosResponse<{
      followId: string;
      followingUserId: string;
      followCount: number;
      fansCount: number;
    }>
  >({
    url: `/users/follow/${userId}`,
    method: "POST",
  });
};

// 取消关注用户
export const unfollowUser = (userId: string) => {
  return request<
    AxiosResponse<{
      followCount: number;
      fansCount: number;
    }>
  >({
    url: `/users/follow/${userId}`,
    method: "DELETE",
  });
};

// 检查关注状态
export const checkFollowStatus = (userId: string) => {
  return request<AxiosResponse<{ isFollowing: boolean }>>({
    url: `/users/follow/check/${userId}`,
    method: "GET",
  });
};

// 获取用户关注列表
export const getUserFollowing = (userId: string, page = 1, limit = 20) => {
  return request<
    AxiosResponse<{
      total: number;
      list: Array<{
        userId: string;
        username: string;
        nickname: string;
        avatar: string;
        bio: string;
        isFollowing: boolean;
      }>;
    }>
  >({
    url: `/users/${userId}/following`,
    method: "GET",
    params: { page, limit },
  });
};

// 获取用户粉丝列表
export const getUserFollowers = (userId: string, page = 1, limit = 20) => {
  return request<
    AxiosResponse<{
      total: number;
      list: Array<{
        userId: string;
        username: string;
        nickname: string;
        avatar: string;
        bio: string;
        isFollowing: boolean;
      }>;
    }>
  >({
    url: `/users/${userId}/followers`,
    method: "GET",
    params: { page, limit },
  });
};

// 获取用户喜欢的笔记
export const getUserLikedPosts = (userId: string, page = 1, limit = 20) => {
  return request<
    AxiosResponse<{
      total: number;
      list: Array<{
        postId: string;
        title: string;
        coverImage: string;
        likeCount: number;
        commentCount: number;
        collectCount: number;
        createdAt: string;
        user: {
          userId: string;
          nickname: string;
          avatar: string;
        };
      }>;
    }>
  >({
    url: `/users/${userId}/likes`,
    method: "GET",
    params: { page, limit },
  });
};

// 获取用户收藏的笔记
export const getUserCollectedPosts = (userId: string, page = 1, limit = 20) => {
  return request<
    AxiosResponse<{
      total: number;
      list: Array<{
        postId: string;
        title: string;
        coverImage: string;
        likeCount: number;
        commentCount: number;
        collectCount: number;
        createdAt: string;
        user: {
          userId: string;
          nickname: string;
          avatar: string;
        };
      }>;
    }>
  >({
    url: `/users/${userId}/collections`,
    method: "GET",
    params: { page, limit },
  });
};
