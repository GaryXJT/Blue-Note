// 用户相关类型
export interface User {
  id?: string;
  userId?: string;
  username?: string;
  nickname?: string;
  name?: string;
  avatar?: string;
  bio?: string;
  role?: "user" | "admin";
  gender?: string;
  birthday?: string;
  location?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

// 统一的帖子类型
export interface Post {
  id: string;
  postId?: string; // 为了兼容旧代码
  title: string;
  content: string;
  summary?: string;
  coverUrl?: string;
  coverImage?: string;
  files?: string[]; // 文件URL列表
  images?: string[];
  video?: string;
  type: "image" | "video"; // 笔记类型
  width?: number;
  height?: number;
  author?: {
    id: string;
    name: string;
    avatar: string;
  };
  status?:
    | "draft"
    | "pending"
    | "published"
    | "reviewing"
    | "rejected"
    | "approved";
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  category?: string;
  dataClass?: string;
  likes: number;
  likeCount?: number;
  views?: number;
  comments?: number;
  commentCount?: number;
  saves?: number;
  userId?: string;
  username?: string;
  nickname?: string;
  avatar?: string;
  likedByUser?: boolean;
  followedByUser?: boolean;
}

// 分页请求参数
export interface PaginationParams {
  page?: number;
  pageSize?: number;
  limit?: number; // 兼容API文档的limit参数
  cursor?: string;
}

// 分页响应数据
export interface PaginationResponse<T> {
  list?: T[];
  posts?: T[]; // 兼容不同API返回格式
  total: number;
  page?: number;
  pageSize?: number;
  limit?: number;
  hasMore: boolean;
  nextCursor?: string;
}

// 帖子列表请求参数
export interface PostListParams extends PaginationParams {
  category?: string;
  dataClass?: string;
  tag?: string;
  search?: string;
  searchType?: string;
  userId?: string;
  currentUserId?: string;
  status?: string;
  type?: "image" | "video";
  filterUser?: string;
  filterType?: string;
}

// 帖子列表响应
export interface PostListResponse extends PaginationResponse<Post> {}

// 统一的评论类型
export interface Comment {
  id: string;
  commentId?: string; // 为了兼容旧代码
  postId: string;
  userId: string;
  username: string;
  nickname: string;
  avatar: string;
  content: string;
  parentId?: string;
  rootId?: string;
  replyToId?: string;
  replyToName?: string;
  likes: number;
  childrenCount?: number;
  level?: number;
  isAuthor?: boolean;
  isAdmin?: boolean;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  likedByUser?: boolean;
  children?: Comment[];
  replies?: Comment[]; // 兼容不同命名
  author?: User;
}

// 评论查询参数
export interface CommentListParams extends PaginationParams {
  postId: string;
  parentId?: string;
  rootId?: string;
}

// 评论列表响应
export interface CommentsResponse {
  comments: Comment[];
  total: number;
  page?: number;
  pageSize?: number;
  hasMore?: boolean;
}

// 评论创建响应
export interface CommentPostResponse extends Comment {}

// 通用API响应格式
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
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

// 帖子统计类型
export interface PostStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// 管理员统计类型
export interface AdminStats {
  users: number;
  posts: PostStats;
  comments: number;
  likes: number;
  totalUsers?: number;
  totalPosts?: number;
  pendingPosts?: number;
  totalComments?: number;
  dailyStats?: DailyStats[];
  tagStats?: TagStats[];
}

// 待审核帖子类型
export interface PendingPost extends Post {
  reviewReason?: string;
  reviewedAt?: string;
  reviewedBy?: User;
}

// 统计相关类型
export interface DailyStats {
  date: string;
  newUsers: number;
  newPosts: number;
  newComments: number;
}

export interface TagStats {
  tag: string;
  count: number;
}

// 通知类型定义
export interface Notification {
  id: string;
  type: "like" | "follow" | "system" | "comment";
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  content: string;
  title?: string;
  postId?: string;
  postTitle?: string;
  postCover?: string;
  createdAt: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  userId?: string;
  updatedAt?: string;
}

// 通知类型枚举
export type NotificationType = "all" | "like" | "follow" | "system" | "comment";

// 菜单类型（特定于此文件的类型，不在API类型中定义）
export type MenuType =
  | "home"
  | "works"
  | "drafts"
  | "publish"
  | "profile"
  | "notifications"
  | "settings"
  | "users"
  | "stats"
  | "admin-posts";
