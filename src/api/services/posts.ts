import { request } from '../axios'
import { Post } from '../../types'

// 创建帖子
export const createPost = (data: {
  title: string
  content: string
  images: string[]
  video?: string
}) => {
  return request<Post>({
    url: '/posts',
    method: 'POST',
    data
  })
}

// 获取帖子列表
export const getPosts = (params?: {
  page?: number
  limit?: number
  userId?: string
  status?: string
  type?: 'image' | 'video'
  tag?: string
}) => {
  return request<{ posts: Post[]; total: number }>({
    url: '/posts',
    method: 'GET',
    params
  })
}

// 获取帖子详情
export const getPostDetail = (postId: string) => {
  return request<Post>({
    url: `/posts/${postId}`,
    method: 'GET'
  })
}

// 更新帖子
export const updatePost = (postId: string, data: {
  title?: string
  content?: string
  images?: string[]
  video?: string
}) => {
  return request<Post>({
    url: `/posts/${postId}`,
    method: 'PUT',
    data
  })
}

// 删除帖子
export const deletePost = (postId: string) => {
  return request({
    url: `/posts/${postId}`,
    method: 'DELETE'
  })
}

// 点赞帖子
export const likePost = (postId: string) => {
  return request({
    url: `/posts/${postId}/like`,
    method: 'POST'
  })
}

// 取消点赞
export const unlikePost = (postId: string) => {
  return request({
    url: `/posts/${postId}/like`,
    method: 'DELETE'
  })
}

// 检查点赞状态
export const checkLikeStatus = (postId: string) => {
  return request<{ hasLiked: boolean }>({
    url: `/posts/${postId}/like`,
    method: 'GET'
  })
}
