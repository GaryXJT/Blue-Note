import { request } from '../axios'
import { AdminStats, PendingPost } from '../../types'

// 获取统计数据
export const getStats = () => {
  return request<AdminStats>({
    url: '/admin/stats',
    method: 'GET'
  })
}

// 获取待审核帖子
export const getPendingPosts = (params?: { page?: number; limit?: number }) => {
  return request<{ posts: PendingPost[]; total: number }>({
    url: '/admin/pending-posts',
    method: 'GET',
    params
  })
}

// 审核帖子
export const reviewPost = (
  postId: string, 
  data: {
    status: 'approved' | 'rejected'
    reason?: string
  }
) => {
  return request({
    url: `/admin/posts/${postId}/review`,
    method: 'PUT',
    data
  })
} 