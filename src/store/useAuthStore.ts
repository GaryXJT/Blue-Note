import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/api/types";
import config from "@/config";

// 身份验证状态接口
interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;
  hydrated: boolean; // 添加新属性跟踪水合状态
  lastUsedTab: string; // 添加上次使用的标签页

  // 操作方法
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setHydrated: (state: boolean) => void; // 设置水合状态的方法
  setLastUsedTab: (tab: string) => void; // 设置上次使用的标签页
}

// 添加调试日志，监控zustand persist的初始化
const log = (config: any) => (set: any, get: any, api: any) => {
  console.log("useAuthStore初始化");

  // 记录中间件包装前的store
  const initialState = config(
    (...args: any) => {
      console.log("状态更新:", ...args);
      set(...args);
    },
    get,
    api
  );
  return initialState;
};

// 创建持久化存储的身份验证状态
const useAuthStore = create<AuthState>()(
  persist(
    log((set: Function) => ({
      // 初始状态
      isLoggedIn: false,
      user: null,
      token: null,
      hydrated: false, // 初始状态为未水合
      lastUsedTab: "posts", // 默认标签页

      // 登录操作 - 设置用户信息和token
      login: (userData: User, token: string) => {
        console.log("Setting token:", token, "user:", userData);
        localStorage.setItem(config.cache.tokenKey, token);
        set({ isLoggedIn: true, user: userData, token });
      },

      // 登出操作 - 清除用户状态
      logout: () => {
        // 从 localStorage 移除并更新状态
        localStorage.removeItem(config.cache.tokenKey);
        set({ isLoggedIn: false, user: null, token: null });
      },

      // 更新用户信息
      updateUser: (userData: Partial<User>) =>
        set((state: AuthState) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      // 设置水合状态
      setHydrated: (state: boolean) => set({ hydrated: state }),

      // 设置上次使用的标签页
      setLastUsedTab: (tab: string) => {
        console.log("设置上次使用的标签页:", tab);
        set({ lastUsedTab: tab });
      },
    })),
    {
      name: config.cache.userInfoKey, // 使用配置文件中的用户信息存储键名
      // 只存储必要的用户信息
      partialize: (state) => ({
        isLoggedIn: state.isLoggedIn,
        token: state.token,
        lastUsedTab: state.lastUsedTab, // 存储上次使用的标签页
        user: state.user
          ? {
              userId: state.user.userId,
              username: state.user.username,
              role: state.user.role,
              avatar: state.user.avatar, // 保留头像URL，用于在界面上显示
              nickname: state.user.nickname, // 保留昵称，用于在界面上显示
            }
          : null,
      }),
      onRehydrateStorage: () => (state) => {
        // 当存储加载（从localStorage）完成时
        console.log("Auth store rehydrated:", state);
        if (state) {
          state.setHydrated(true); // 设置水合状态为true
          console.log("用户状态已从持久化存储恢复:", {
            isLoggedIn: state.isLoggedIn,
            userId: state.user?.userId,
            username: state.user?.username,
          });
        }
      },
    }
  )
);

export default useAuthStore;
