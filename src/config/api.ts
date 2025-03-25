// API配置
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
  timeout: 10000,
}

// 上传配置
export const UPLOAD_CONFIG = {
  uploadUrl: '/upload',
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
}
