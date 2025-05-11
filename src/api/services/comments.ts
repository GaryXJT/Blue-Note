import { request } from "../axios";
import {
  Comment,
  CommentsResponse,
  CommentPostResponse,
  ApiResponse,
} from "../types";

interface GetCommentsParams {
  postId: string;
  parentId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "time" | "likes";
  order?: "asc" | "desc";
}

interface CreateCommentParams {
  postId: string;
  content: string;
  parentId?: string;
  replyToId?: string;
}

// 获取帖子评论列表（分页）
export const getComments = (params: GetCommentsParams) => {
  return request<ApiResponse<CommentsResponse>>({
    url: `/posts/${params.postId}/comments`,
    method: "get",
    params: {
      parentId: params.parentId,
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      sortBy: params.sortBy || "time",
      order: params.order || "desc",
    },
  });
};

// 获取帖子所有评论（不分页）
export const getAllComments = (
  postId: string,
  params?: {
    sortBy?: "time" | "likes";
    order?: "asc" | "desc";
  }
) => {
  return request<
    ApiResponse<{
      comments: Comment[];
      total: number;
    }>
  >({
    url: `/posts/${postId}/comments/all`,
    method: "get",
    params: {
      sortBy: params?.sortBy || "time",
      order: params?.order || "desc",
    },
  });
};

// 获取评论的子评论
export const getChildComments = (
  postId: string,
  parentId: string,
  params?: Omit<GetCommentsParams, "postId" | "parentId">
) => {
  return request<ApiResponse<CommentsResponse>>({
    url: `/posts/${postId}/comments`,
    method: "get",
    params: {
      parentId,
      page: params?.page || 1,
      pageSize: params?.pageSize || 20,
      sortBy: params?.sortBy || "time",
      order: params?.order || "desc",
    },
  });
};

// 发布评论
export const createComment = (data: CreateCommentParams) => {
  return request<ApiResponse<CommentPostResponse>>({
    url: "/comments",
    method: "post",
    data,
  });
};

// 点赞评论
export const likeComment = (commentId: string) => {
  return request({
    url: `/comments/${commentId}/like`,
    method: "post",
  });
};

// 取消点赞评论
export const unlikeComment = (commentId: string) => {
  return request({
    url: `/comments/${commentId}/like`,
    method: "delete",
  });
};

// 检查评论点赞状态
export const checkCommentLikeStatus = (commentId: string) => {
  return request<ApiResponse<{ hasLiked: boolean }>>({
    url: `/comments/${commentId}/like`,
    method: "get",
  });
};

// 删除评论
export const deleteComment = (commentId: string) => {
  return request({
    url: `/comments/${commentId}`,
    method: "delete",
  });
};
