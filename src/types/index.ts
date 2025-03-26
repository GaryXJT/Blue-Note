// 用户类型
export interface User {
  userId?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  role?: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  location?: string;
  status?: string;
}

// 用户资料信息
export interface UserInfo {
  avatar: string;
  nickname: string;
  username: string;
  accountId: string;
  bio?: string;
  gender?: string;
  birthday?: string;
  location?: string;
  status?: string;
  followCount: number;
  fansCount: number;
  likeCount: number;
  collectCount: number;
  postCount: number;
}

// 菜单类型
export type MenuType = 'publish' | 'drafts' | 'works' | 'profile' | 'home' | 'notifications'

// 帖子类型
export interface Post {
  id: string
  title: string
  content: string
  images: string[]
  video?: string
  author: User
  likes: number
  comments: number
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

// 评论类型
export interface Comment {
  id: string
  content: string
  author: User
  postId: string
  parentId?: string
  likes: number
  replies: Comment[]
  createdAt: string
  updatedAt: string
}

// 帖子统计类型
export interface PostStats {
  total: number
  pending: number
  approved: number
  rejected: number
}

// 管理员统计类型
export interface AdminStats {
  users: number
  posts: PostStats
  comments: number
  likes: number
}

// 待审核帖子类型
export interface PendingPost extends Post {
  reviewReason?: string
  reviewedAt?: string
  reviewedBy?: User
} 