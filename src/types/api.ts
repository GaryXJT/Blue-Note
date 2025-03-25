// 用户相关类型
export interface User {
  userId: string
  username: string
  nickname: string
  avatar: string
  bio: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
}

// 帖子相关类型
export interface Post {
  postId: string
  title: string
  content: string
  type: 'image' | 'video'
  tags: string[]
  files: string[]
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  userId: string
  username: string
  nickname: string
  avatar: string
  likes: number
  comments: number
  createdAt: string
  updatedAt: string
}

// 评论相关类型
export interface Comment {
  commentId: string
  content: string
  userId: string
  username: string
  nickname: string
  avatar: string
  createdAt: string
}

// 统计数据相关类型
export interface DailyStats {
  date: string
  newUsers: number
  newPosts: number
  newComments: number
}

export interface TagStats {
  tag: string
  count: number
}

export interface AdminStats {
  totalUsers: number
  totalPosts: number
  pendingPosts: number
  totalComments: number
  dailyStats: DailyStats[]
  tagStats: TagStats[]
}

// 分页响应类型
export interface PaginatedResponse<T> {
  total: number
  page: number
  limit: number
  posts: T[]
}
