export interface User {
  id: string
  username: string
  email: string
  createdAt: Date
  updatedAt: Date
  profile?: {
    avatar?: string
    bio?: string
    location?: string
  }
}

export type UserCreateInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>
export type UserUpdateInput = Partial<UserCreateInput>
