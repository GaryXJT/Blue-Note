import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from '@/types';

// 身份验证状态接口
interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
  token: string | null;

  // 操作方法
  login: (userData: User, token: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// 创建持久化存储的身份验证状态
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 初始状态
      isLoggedIn: false,
      user: null,
      token: null,

      // 登录操作 - 设置用户信息和token
      login: (userData, token) => {
        console.log("Setting token:", token); // 添加调试日志
        localStorage.setItem("token", token);
        set({ isLoggedIn: true, user: userData, token });
      },

      // 登出操作 - 清除用户状态
      logout: () => {
        // 从 localStorage 移除并更新状态
        localStorage.removeItem("token");
        set({ isLoggedIn: false, user: null, token: null });
      },

      // 更新用户信息
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null
        })),
    }),
    {
      name: "auth-storage",
      // 存储所有状态，不使用 partialize
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);

export default useAuthStore;
