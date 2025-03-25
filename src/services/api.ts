import request from './request'
import { UPLOAD_CONFIG } from '../config/api'
import {
  User,
  Post,
  Comment,
  PostStats,
  AdminStats,
  PendingPost,
} from '../types'

// 用户相关API
export const userAPI = {
  // 获取验证码
  getCaptcha: () => {
    return request.get<{ captcha: string }>('/auth/captcha')
  },

  // 用户注册
  register: (data: {
    username: string
    password: string
    email: string
    captcha: string
  }) => {
    return request.post<{ token: string }>('/auth/register', data)
  },

  // 用户登录
  login: (data: { username: string; password: string; captcha: string }) => {
    return request.post<{ token: string }>('/auth/login', data)
  },

  // 获取用户信息
  getProfile: () => {
    return request.get<User>('/users/profile')
  },

  // 更新用户信息
  updateProfile: (data: {
    nickname?: string
    avatar?: string
    bio?: string
  }) => {
    return request.put<User>('/users/profile', data)
  },
}

// 帖子相关API
export const postAPI = {
  // 创建帖子
  createPost: (data: {
    title: string
    content: string
    images: string[]
    video?: string
  }) => {
    return request.post<Post>('/posts', data)
  },

  // 获取帖子列表
  getPosts: (params?: {
    page?: number
    limit?: number
    userId?: string
    status?: string
  }) => {
    return request.get<{ posts: Post[]; total: number }>('/posts', { params })
  },

  // 获取帖子详情
  getPostDetail: (postId: string) => {
    return request.get<Post>(`/posts/${postId}`)
  },

  // 更新帖子
  updatePost: (postId: string, data: {
    title?: string
    content?: string
    images?: string[]
    video?: string
  }) => {
    return request.put<Post>(`/posts/${postId}`, data)
  },

  // 删除帖子
  deletePost: (postId: string) => {
    return request.delete(`/posts/${postId}`)
  },

  // 点赞帖子
  likePost: (postId: string) => {
    return request.post(`/posts/${postId}/like`)
  },

  // 取消点赞
  unlikePost: (postId: string) => {
    return request.delete(`/posts/${postId}/like`)
  },

  // 检查点赞状态
  checkLikeStatus: (postId: string) => {
    return request.get<{ hasLiked: boolean }>(`/posts/${postId}/like`)
  },
}

// 评论相关API
export const commentAPI = {
  // 获取评论列表
  getComments: (postId: string, params?: { page?: number; limit?: number }) => {
    return request.get<{ comments: Comment[]; total: number }>(
      `/posts/${postId}/comments`,
      { params }
    )
  },

  // 创建评论
  createComment: (postId: string, content: string, parentId?: string) => {
    return request.post<Comment>(`/posts/${postId}/comments`, {
      content,
      parentId,
    })
  },

  // 删除评论
  deleteComment: (postId: string, commentId: string) => {
    return request.delete(`/posts/${postId}/comments/${commentId}`)
  },

  // 点赞评论
  likeComment: (postId: string, commentId: string) => {
    return request.post(`/posts/${postId}/comments/${commentId}/like`)
  },

  // 取消评论点赞
  unlikeComment: (postId: string, commentId: string) => {
    return request.delete(`/posts/${postId}/comments/${commentId}/like`)
  },

  // 检查评论点赞状态
  checkCommentLikeStatus: (postId: string, commentId: string) => {
    return request.get<{ hasLiked: boolean }>(
      `/posts/${postId}/comments/${commentId}/like`
    )
  },
}

// 管理员相关API
export const adminAPI = {
  // 获取统计数据
  getStats: () => {
    return request.get<AdminStats>('/admin/stats')
  },

  // 获取待审核帖子
  getPendingPosts: (params?: { page?: number; limit?: number }) => {
    return request.get<{ posts: PendingPost[]; total: number }>(
      '/admin/pending-posts',
      { params }
    )
  },

  // 审核帖子
  reviewPost: (postId: string, data: {
    status: 'approved' | 'rejected'
    reason?: string
  }) => {
    return request.put(`/admin/posts/${postId}/review`, data)
  },
}

// 文件上传API
export const uploadAPI = {
  // 上传文件
  uploadFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return request.post<{ url: string }>(UPLOAD_CONFIG.uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
} 