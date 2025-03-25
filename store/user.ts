import { defineStore } from 'pinia'
import { User } from '../models/User'

interface UserState {
  currentUser: User | null
  isLoading: boolean
  error: string | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    currentUser: null,
    isLoading: false,
    error: null,
  }),

  getters: {
    isAuthenticated: (state) => !!state.currentUser,
    userProfile: (state) => state.currentUser?.profile,
  },

  actions: {
    setUser(user: User | null) {
      this.currentUser = user
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setError(error: string | null) {
      this.error = error
    },
  },
})
