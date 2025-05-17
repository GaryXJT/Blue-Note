// 这里是项目配置文件 
// 如果项目在本地运行 请将isProd设置为true 如果项目在生产环境运行 请将isProd设置为false 并输入你的后端地址

// 环境变量
const isProd = true;

// 系统配置
const config = {
  // API相关配置
  api: {
    // API基础URL
    baseURL:
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      (isProd
        ? "https://your-production-api.com/api/v1" // 生产环境API地址
        : "http://localhost:8080/api/v1"), // 开发环境API地址
    timeout: 10000, // 请求超时时间(ms)
    withCredentials: false, // 是否携带cookie
  },

  // 上传相关配置
  upload: {
    maxImageSize: 10, // 图片最大尺寸(MB)
    maxVideoSize: 100, // 视频最大尺寸(MB)
    allowedImageTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    allowedVideoTypes: ["video/mp4", "video/webm", "video/quicktime"],
  },

  // 缓存相关配置
  cache: {
    tokenKey: "blue_note_token", // token存储键名
    userInfoKey: "blue_note_user_info", // 用户信息存储键名
    expireTime: 7 * 24 * 60 * 60 * 1000, // token过期时间(ms)，这里设为7天
  },

  // 内容显示配置
  content: {
    pageSize: 10, // 默认分页大小
    defaultImageRatio: 1, // 默认图片显示比例 (宽:高 = 1:1)
    defaultVideoRatio: 16 / 9, // 默认视频显示比例 (16:9)
  },

  // 路由配置
  routes: {
    home: "/",
    login: "/login",
    profile: "/profile",
    post: "/post",
  },
};

export default config;
