import { request } from "../axios";
import { Post } from "../../types";
import { AxiosResponse } from "axios";
import { ApiResponse } from "../axios";

/**
 * 文件上传函数
 * @param file 要上传的文件
 * @param type 文件类型 "image" 或 "video"
 * @param onProgress 上传进度回调
 * @returns 上传后的文件信息
 */
export const uploadFile = async (
  file: File,
  type: "image" | "video",
  onProgress?: (percent: number) => void
) => {
  console.log(
    `开始上传${type === "video" ? "视频" : "图片"}:`,
    file.name,
    file.size,
    file.type
  );

  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);

  try {
    const response = await request<{
      code: number;
      data: {
        name: string;
        size: number;
        type: string;
        url: string;
      };
      message: string;
    }>({
      url: "/upload",
      method: "POST",
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (event) => {
        if (onProgress && event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          console.log(
            `${type === "video" ? "视频" : "图片"}上传进度: ${percent}%`
          );
          onProgress(percent);
        }
      },
    });

    console.log(
      `${type === "video" ? "视频" : "图片"}上传成功, 响应:`,
      response
    );
    return response;
  } catch (error) {
    console.error(`${type === "video" ? "视频" : "图片"}上传失败:`, error);
    throw error;
  }
};

/**
 * 文件验证函数
 * @param file 要验证的文件
 * @param type 文件类型 "image" 或 "video"
 * @returns 验证结果对象
 */
export const validateFile = (
  file: File,
  type: "image" | "video"
): { valid: boolean; message?: string } => {
  // 图片验证
  if (type === "image") {
    // 检查文件大小 (最大10MB)
    const isValidSize = file.size <= 10 * 1024 * 1024;
    if (!isValidSize) {
      return { valid: false, message: "图片大小不能超过10MB" };
    }

    // 检查文件类型
    const validImageTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    const isValidType = validImageTypes.includes(file.type);
    if (!isValidType) {
      return { valid: false, message: "只支持JPEG、PNG、GIF和WebP格式的图片" };
    }

    return { valid: true };
  }

  // 视频验证
  if (type === "video") {
    // 检查文件大小 (最大100MB)
    const isValidSize = file.size <= 100 * 1024 * 1024;
    if (!isValidSize) {
      return { valid: false, message: "视频大小不能超过100MB" };
    }

    // 检查文件类型
    const validVideoTypes = [
      "video/mp4",
      "video/webm",
      "video/quicktime",
      "video/x-msvideo",
    ];
    const isValidType = validVideoTypes.includes(file.type);
    if (!isValidType) {
      return { valid: false, message: "只支持MP4、WebM、MOV和AVI格式的视频" };
    }

    return { valid: true };
  }

  return { valid: false, message: "不支持的文件类型" };
};

// 创建帖子
export const createPost = (data: {
  title: string;
  content: string;
  files: string[];
  type: "image" | "video";
  tags: string[];
  isDraft?: boolean;
}) => {
  return request<AxiosResponse<Post>>({
    url: "/posts",
    method: "POST",
    data,
  });
};

// 获取帖子列表
export const getPosts = (params?: {
  cursor?: string;
  limit?: number;
  userId?: string;
  status?: string;
  type?: "image" | "video";
  tag?: string;
}) => {
  return request<
    AxiosResponse<
      ApiResponse<{
        list: {
          id: string;
          postId?: string;
          title: string;
          content: string;
          type: string;
          tags?: string[];
          files?: string[];
          coverImage?: string;
          width?: number;
          height?: number;
          userId: string;
          username?: string;
          nickname?: string;
          avatar?: string;
          likes?: number;
          comments?: number;
          likeCount?: number;
          commentCount?: number;
          collectCount?: number;
          createdAt: string;
          updatedAt?: string;
          user?: {
            userId: string;
            nickname?: string;
            avatar?: string;
          };
        }[];
        total: number;
      }>
    >
  >({
    url: "/posts",
    method: "GET",
    params,
  });
};

// 获取帖子详情
export const getPostDetail = (postId: string) => {
  return request<AxiosResponse<ApiResponse<Post>>>({
    url: `/posts/${postId}`,
    method: "GET",
  });
};

// 更新帖子
export const updatePost = (
  postId: string,
  data: {
    title?: string;
    content?: string;
    images?: string[];
    video?: string;
    tags?: string[];
    location?: string;
  }
) => {
  return request<AxiosResponse<Post>>({
    url: `/posts/${postId}`,
    method: "PUT",
    data,
  });
};

// 删除帖子
export const deletePost = (postId: string) => {
  return request<AxiosResponse<{ success: boolean }>>({
    url: `/posts/${postId}`,
    method: "DELETE",
  });
};

// 点赞帖子
export const likePost = (postId: string) => {
  return request<AxiosResponse<{ success: boolean }>>({
    url: `/posts/${postId}/like`,
    method: "POST",
  });
};

// 取消点赞
export const unlikePost = (postId: string) => {
  return request<AxiosResponse<{ success: boolean }>>({
    url: `/posts/${postId}/like`,
    method: "DELETE",
  });
};

// 检查点赞状态
export const checkLikeStatus = (postId: string) => {
  return request<AxiosResponse<{ hasLiked: boolean }>>({
    url: `/posts/${postId}/like`,
    method: "GET",
  });
};

// 收藏帖子
export const collectPost = (postId: string) => {
  return request<AxiosResponse<{ success: boolean }>>({
    url: `/posts/${postId}/collect`,
    method: "POST",
  });
};

// 取消收藏
export const uncollectPost = (postId: string) => {
  return request<AxiosResponse<{ success: boolean }>>({
    url: `/posts/${postId}/collect`,
    method: "DELETE",
  });
};

// 检查收藏状态
export const checkCollectStatus = (postId: string) => {
  return request<AxiosResponse<{ hasCollected: boolean }>>({
    url: `/posts/${postId}/collect`,
    method: "GET",
  });
};

// 保存草稿
export const saveDraft = (
  data: {
    title?: string;
    content?: string;
    type: "image" | "video";
    tags?: string[];
    files?: string[];
  },
  draftId?: string
) => {
  const url = draftId ? `/posts/draft?draftId=${draftId}` : "/posts/draft";
  return request<AxiosResponse<Post>>({
    url,
    method: "POST",
    data,
  });
};

// 获取草稿列表
export const getDrafts = (params?: { page?: number; limit?: number }) => {
  return request<
    AxiosResponse<
      ApiResponse<{
        total: number;
        list: {
          id?: string;
          postId?: string;
          title: string;
          content: string;
          type: string;
          tags?: string[];
          files?: string[];
          coverImage?: string;
          userId: string;
          username?: string;
          nickname?: string;
          avatar?: string;
          likes?: number;
          comments?: number;
          likeCount?: number;
          commentCount?: number;
          collectCount?: number;
          createdAt: string;
          updatedAt: string;
          user?: {
            userId: string;
            nickname?: string;
            avatar?: string;
          };
        }[];
      }>
    >
  >({
    url: "/posts/drafts",
    method: "GET",
    params,
  });
};

// 获取草稿详情
export const getDraftDetail = (draftId: string) => {
  return request<AxiosResponse<ApiResponse<Post>>>({
    url: `/posts/draft/${draftId}`,
    method: "GET",
  });
};

// 删除草稿
export const deleteDraft = (draftId: string) => {
  return request<AxiosResponse<{ success: boolean }>>({
    url: `/posts/draft/${draftId}`,
    method: "DELETE",
  });
};

// 发布草稿
export const publishDraft = (
  draftId: string,
  data?: {
    title?: string;
    content?: string;
    tags?: string[];
    files?: string[];
  }
) => {
  return request<AxiosResponse<Post>>({
    url: `/posts/draft/${draftId}/publish`,
    method: "POST",
    data,
  });
};

/**
 * 删除已上传但未使用的临时文件
 * @param fileUrl 要删除的文件URL或路径
 * @returns 删除操作的响应
 */
export const deleteUploadedFile = async (
  fileUrl: string
): Promise<ApiResponse<any>> => {
  try {
    console.log("开始删除临时文件:", fileUrl);

    // 从URL中提取文件路径 (如果需要)
    const filePath = extractFilePathFromUrl(fileUrl);

    const response = await request({
      url: "/file/delete",
      method: "POST",
      data: { filePath },
    });

    console.log("文件删除响应:", response);
    return response.data;
  } catch (error) {
    console.error("删除文件失败:", error);
    throw error;
  }
};

/**
 * 从完整URL中提取文件路径
 * @param fileUrl 完整的文件URL
 * @returns 文件路径
 */
const extractFilePathFromUrl = (fileUrl: string): string => {
  try {
    // 如果已经是相对路径格式（不包含http/https），直接处理
    if (!fileUrl.includes("http")) {
      // 移除前导斜杠
      return fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
    }

    // 尝试从URL中提取路径部分
    const url = new URL(fileUrl);
    let path = url.pathname;

    // 移除前导斜杠
    if (path.startsWith("/")) {
      path = path.substring(1);
    }

    // 移除存储桶名称（如果存在）
    // 通常存储桶名称是路径的第一部分，格式为：/bucket-name/file-path
    const pathParts = path.split("/");
    if (pathParts.length > 1) {
      // 移除第一部分（存储桶名称）
      return pathParts.slice(1).join("/");
    }

    return path;
  } catch (error) {
    console.warn("无法解析URL，返回处理后的原始值:", fileUrl);
    // 如果解析失败，尝试移除前导斜杠
    return fileUrl.startsWith("/") ? fileUrl.substring(1) : fileUrl;
  }
};
