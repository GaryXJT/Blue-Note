// 用户类型
export interface User {
  id?: string;
  userId?: string;
  username?: string;
  nickname?: string;
  name?: string;
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

// 帖子类型
export interface Post {
  id: string;
  title: string;
  content: string;
  images?: string[];
  files?: string[];
  coverUrl?: string;
  video?: string;
  type: "image" | "video";
  author?: User;
  userId?: string;
  username?: string;
  nickname?: string;
  likes: number;
  comments?: number;
  saves?: number;
  status:
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
}

// 评论类型
export interface Comment {
  id: string;
  content: string;
  author: User;
  postId: string;
  parentId?: string;
  likes: number;
  replies: Comment[];
  createdAt: string;
  updatedAt: string;
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
}

// 待审核帖子类型
export interface PendingPost extends Post {
  reviewReason?: string;
  reviewedAt?: string;
  reviewedBy?: User;
}
