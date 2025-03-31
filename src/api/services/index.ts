// 导出所有API服务
export * as authAPI from "./auth";
export * as postsAPI from "./posts";
export * as commentsAPI from "./comments";
export * as adminAPI from "./admin";
export * as profileAPI from "./profile";
// userAPI已移除，相关功能已合并到profileAPI中

// 导出身份验证API
export * from "./auth";

// 或者如果有命名导出
// export { getCaptcha, loginOrRegister } from './auth'
