export interface User {
  userId: string
  username: string
  nickname: string
  avatar: string
  bio: string
  role: 'user' | 'admin'
  createdAt: string
  updatedAt: string
} 