"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuthStore } from "../lib/auth-store"

const links = [
  { href: "/",        label: "首页",     icon: "🏠" },
  { href: "/episodes", label: "播客",     icon: "🎙" },
  { href: "/players",  label: "球员",     icon: "🏈" },
  { href: "/qa",       label: "规则问答", icon: "❓" },
  { href: "/learn",    label: "科普干货", icon: "📖" },
]

export default function Nav() {
  const pathname = usePathname()
  const router   = useRouter()
  const { user, init, logout, isInitialized } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => { init() }, [init])
  // 路由变化时关闭菜单
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const handleLogout = async () => {
    await logout()
    router.push("/")
  }

  return (
    <>
      <nav className="border-b border-white/8 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 bg-black/40 backdrop-blur-2xl z-30"
        style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.3)" }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
          <img src="/logo.png" alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-[#3eb489]/40 group-hover:ring-[#3eb489]/70 transition-all" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-dancing)" }}>
            畅所煜彦
          </span>
        </Link>

        {/* 桌面端：横排 tab（md 以上显示） */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(l => (
            <Link key={l.href} href={l.href}
              className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
                pathname === l.href ? "bg-white/10 text-white font-medium" : "text-white/40 hover:text-white hover:bg-white/5"
              }`}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* 右侧 */}
        <div className="flex items-center gap-2">
          {/* 桌面端用户区 */}
          <div className="hidden md:flex items-center gap-3">
            {!isInitialized ? (
              <div className="w-16 h-8 bg-white/5 rounded-full animate-pulse" />
            ) : user ? (
              <>
                <Link href="/me" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <div className="w-7 h-7 bg-gradient-to-br from-[#3eb489] to-[#2d9e6b] rounded-full flex items-center justify-center text-xs text-white font-bold">
                    {user.nickname[0].toUpperCase()}
                  </div>
                  <span className="text-sm text-white/70">{user.nickname}</span>
                </Link>
                <button onClick={handleLogout} className="text-xs text-white/30 hover:text-white/60 transition-colors px-3 py-1.5 bg-white/5 border border-white/10 rounded-full">
                  退出
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/50 hover:text-white px-3 py-1.5">登录</Link>
                <Link href="/register" className="text-sm bg-amber-500/80 hover:bg-amber-400 text-white px-4 py-1.5 rounded-full font-medium transition-colors">注册</Link>
              </>
            )}
          </div>

          {/* 手机端：头像（已登录）+ 汉堡按钮 */}
          {user && (
            <Link href="/me" className="md:hidden w-8 h-8 bg-gradient-to-br from-[#3eb489] to-[#2d9e6b] rounded-full flex items-center justify-center text-xs text-white font-bold">
              {user.nickname[0].toUpperCase()}
            </Link>
          )}
          <button onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-9 h-9 flex flex-col items-center justify-center gap-1 rounded-lg hover:bg-white/5 transition-colors">
            <span className={`block w-5 h-0.5 bg-white/70 transition-all ${menuOpen ? "rotate-45 translate-y-1.5" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white/70 transition-all ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white/70 transition-all ${menuOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
          </button>
        </div>
      </nav>

      {/* 手机端抽屉菜单 */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-20" onClick={() => setMenuOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="absolute top-[57px] left-0 right-0 bg-[#0a0a0c] border-b border-white/10 p-3 space-y-1 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {links.map(l => (
              <Link key={l.href} href={l.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${
                  pathname === l.href ? "bg-[#3eb489]/15 text-[#a8edcf] font-medium" : "text-white/60 hover:bg-white/5"
                }`}>
                <span className="text-lg">{l.icon}</span>
                {l.label}
              </Link>
            ))}
            <div className="border-t border-white/8 mt-2 pt-2">
              {user ? (
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/50 hover:bg-white/5">
                  <span className="text-lg">🚪</span> 退出登录
                </button>
              ) : (
                <div className="flex gap-2 px-2">
                  <Link href="/login" className="flex-1 text-center text-sm text-white/60 py-2.5 bg-white/5 rounded-xl">登录</Link>
                  <Link href="/register" className="flex-1 text-center text-sm text-white bg-amber-500/80 py-2.5 rounded-xl font-medium">注册</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
