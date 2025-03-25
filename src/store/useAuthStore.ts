import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// 用户模型定义
interface User {
  userId: string
  username: string
  nickname?: string
  avatar?: string
  role: string
}

// 身份验证状态接口
interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  
  // 操作方法
  login: (user: User, token: string) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
}

// 创建持久化存储的身份验证状态
const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // 初始状态
      user: null,
      token: null,
      isLoggedIn: false,
      
      // 登录操作 - 设置用户信息和token
      login: (user, token) => set({
        user,
        token,
        isLoggedIn: true
      }),
      
      // 登出操作 - 清除用户状态
      logout: () => set({
        user: null,
        token: null,
        isLoggedIn: false
      }),
      
      // 更新用户信息
      updateUser: (userData) => set((state) => ({
        user: state.user ? { ...state.user, ...userData } : null
      }))
    }),
    {
      name: 'auth-storage', // localStorage的键名
      storage: createJSONStorage(() => localStorage) // 使用localStorage进行持久化
    }
  )
)

export default useAuthStore 