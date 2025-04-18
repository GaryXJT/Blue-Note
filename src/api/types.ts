// 帖子类型定义
export interface Post {
  id: string;
  title: string;
  content: string;
  summary?: string;
  coverUrl?: string;
  files?: string[]; // 文件URL列表
  type: "image" | "video"; // 笔记类型
  width?: number;
  height?: number;
  images?: string[];
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  status?: "pending" | "published" | "reviewing" | "rejected" | "draft";
  createdAt: string;
  updatedAt: string;
  tags?: string[];
  category?: string;
  likes: number;
  views?: number;
  commentCount?: number;
  comments?: number;
  saves?: number;
  userId?: string;
  username?: string;
  nickname?: string;
}

// 分页请求参数
export interface PaginationParams {
  page: number;
  pageSize: number;
  limit?: number; // 兼容API文档的limit参数
}

// 分页响应数据
export interface PaginationResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// 帖子列表请求参数
export interface PostListParams extends PaginationParams {
  category?: string;
  tag?: string;
  search?: string;
  userId?: string;
  status?: string;
  type?: "image" | "video";
}

// 帖子列表响应
export interface PostListResponse extends PaginationResponse<Post> {}
