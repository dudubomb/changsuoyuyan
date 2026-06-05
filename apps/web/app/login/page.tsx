"use client"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuthStore } from "../lib/auth-store"

export default function LoginPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const { login, isLoading }    = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await login(email, password)
      router.push("/")
    } catch (err: any) {
      setError(err.message)
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <h1
            className="text-white"
            style={{ fontFamily: "var(--font-dancing)", fontSize: "2.2rem", fontWeight: 700 }}
          >
            畅所煜彦
          </h1>
          <p className="text-white/40 text-sm">登录你的账号</p>
        </div>

        {/* Form */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1">
              <label className="text-xs text-white/40">邮箱</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-white/40">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
              />
            </div>

            {error && (
              <p className="text-red-400/80 text-xs bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-amber-500/80 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
            >
              {isLoading ? "登录中..." : "登录"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-white/30">
          还没有账号？{" "}
          <Link href="/register" className="text-amber-400/80 hover:text-amber-300 transition-colors">
            立即注册
          </Link>
        </p>
      </div>
    </main>
  )
}
