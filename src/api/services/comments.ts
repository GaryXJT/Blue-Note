import { request } from '../axios'
import { Comment } from '../../types'

// 获取评论列表
export const getComments = (postId: string, params?: { page?: number; limit?: number }) => {
  return request<{ comments: Comment[]; total: number }>({
    url: `/posts/${postId}/comments`,
    method: 'GET',
    params
  })
}

// 创建评论
export const createComment = (postId: string, content: string, parentId?: string) => {
  return request<Comment>({
    url: `/posts/${postId}/comments`,
    method: 'POST',
    data: {
      content,
      parentId
    }
  })
}

// 删除评论
export const deleteComment = (postId: string, commentId: string) => {
  return request({
    url: `/posts/${postId}/comments/${commentId}`,
    method: 'DELETE'
  })
}

// 点赞评论
export const likeComment = (postId: string, commentId: string) => {
  return request({
    url: `/posts/${postId}/comments/${commentId}/like`,
    method: 'POST'
  })
}

// 取消评论点赞
export const unlikeComment = (postId: string, commentId: string) => {
  return request({
    url: `/posts/${postId}/comments/${commentId}/like`,
    method: 'DELETE'
  })
}

// 检查评论点赞状态
export const checkCommentLikeStatus = (postId: string, commentId: string) => {
  return request<{ hasLiked: boolean }>({
    url: `/posts/${postId}/comments/${commentId}/like`,
    method: 'GET'
  })
} 