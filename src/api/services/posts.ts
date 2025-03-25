import { request } from '../axios'
import { Post, PostListParams, PostListResponse } from '../types'

export const PostsApi = {
  // 获取帖子列表
  getPosts: (params: PostListParams) =>
    request<PostListResponse>({
      url: '/posts',
      method: 'GET',
      params,
    }),

  // 获取单个帖子详情
  getPost: (id: string) =>
    request<Post>({
      url: `/posts/${id}`,
      method: 'GET',
    }),

  // 点赞帖子
  likePost: (id: string) =>
    request<{ likes: number }>({
      url: `/posts/${id}/like`,
      method: 'POST',
    }),

  // 取消点赞
  unlikePost: (id: string) =>
    request<{ likes: number }>({
      url: `/posts/${id}/unlike`,
      method: 'POST',
    }),
}
