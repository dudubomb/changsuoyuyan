"use client"
import { create } from "zustand"
import { authApi } from "./api"

interface User {
  id: string
  email: string
  nickname: string
  role: string
  isVerified: boolean
  avatar?: string
}

interface AuthStore {
  user: User | null
  isLoading: boolean
  isInitialized: boolean
  // actions
  login:    (email: string, password: string) => Promise<void>
  register: (email: string, password: string, nickname: string) => Promise<void>
  logout:   () => Promise<void>
  init:     () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  // 页面加载时检查是否已登录
  init: async () => {
    const token = localStorage.getItem("accessToken")
    if (!token) return set({ isInitialized: true })
    try {
      const { data } = await authApi.me()
      set({ user: data.data, isInitialized: true })
    } catch {
      localStorage.removeItem("accessToken")
      localStorage.removeItem("refreshToken")
      set({ isInitialized: true })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await authApi.login({ email, password })
      localStorage.setItem("accessToken",  data.data.accessToken)
      localStorage.setItem("refreshToken", data.data.refreshToken)
      set({ user: data.data.user, isLoading: false })
    } catch (err: any) {
      set({ isLoading: false })
      throw new Error(err.response?.data?.error ?? "登录失败")
    }
  },

  register: async (email, password, nickname) => {
    set({ isLoading: true })
    try {
      const { data } = await authApi.register({ email, password, nickname })
      localStorage.setItem("accessToken",  data.data.accessToken)
      localStorage.setItem("refreshToken", data.data.refreshToken)
      set({ user: data.data.user, isLoading: false })
    } catch (err: any) {
      set({ isLoading: false })
      throw new Error(err.response?.data?.error ?? "注册失败")
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken") ?? ""
    try { await authApi.logout(refreshToken) } catch {}
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    set({ user: null })
  },
}))
