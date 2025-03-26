import { request } from "../axios";
import { UserInfo, User } from "@/types";
import { AxiosResponse } from "axios";

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
  avatar?: string;
  bio?: string;
  gender?: "male" | "female" | "other";
  birthday?: string;
  location?: string;
  status?: string;
}) => {
  return request<AxiosResponse<User>>({
    url: "/users/profile",
    method: "PUT",
    data,
  });
};

// 上传头像
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
