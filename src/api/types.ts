// 帖子类型定义
export interface Post {
  id: string
  title: string
  content: string
  summary?: string
  coverUrl: string
  width?: number
  height?: number
  images?: string[]
  author: {
    id: string
    name: string
    avatar: string
  }
  createdAt: string
  updatedAt: string
  tags?: string[]
  category?: string
  likes: number
  views?: number
  commentCount?: number
}

// 分页请求参数
export interface PaginationParams {
  page: number
  pageSize: number
}

// 分页响应数据
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

// 帖子列表请求参数
export interface PostListParams extends PaginationParams {
  category?: string
  tag?: string
  search?: string
}

// 帖子列表响应
export interface PostListResponse extends PaginationResponse<Post> {}
