"use client"
import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "../lib/auth-store"
import { useMyQuestions, useMyComments, useMyAnswers, useQuizStats, useContinueListening } from "../lib/hooks"

function formatDuration(s: number) {
  const m = Math.floor(s / 60); return `${m}m`
}

export default function ProfilePage() {
  const { user, isInitialized, logout } = useAuthStore()
  const router = useRouter()

  const { data: questions = [] } = useMyQuestions()
  const { data: comments = [] }  = useMyComments()
  const { data: answersList = [] } = useMyAnswers()
  const { data: quizStats }      = useQuizStats()
  const { data: continueList = [] } = useContinueListening()

  useEffect(() => {
    if (isInitialized && !user) router.push("/login")
  }, [isInitialized, user, router])

  if (!user) return (
    <main className="flex-1 flex items-center justify-center text-white/30">加载中...</main>
  )

  return (
    <main className="max-w-4xl mx-auto px-6 py-10 w-full space-y-8">

      {/* 用户头部 */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex items-center gap-5">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#3eb489] to-[#2d9e6b] flex items-center justify-center text-3xl font-black text-white">
          {user.nickname[0].toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-white">{user.nickname}</h1>
          <p className="text-sm text-white/40 mt-0.5">{user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-white/8 border border-white/10 px-2 py-0.5 rounded-full text-white/60">{user.role}</span>
            {user.isVerified && <span className="text-xs bg-amber-400/10 border border-amber-400/20 text-amber-400 px-2 py-0.5 rounded-full">✓ 认证用户</span>}
          </div>
        </div>
        <button onClick={() => { logout(); router.push("/") }}
          className="text-xs text-white/30 hover:text-white/60 transition-colors px-4 py-2 bg-white/5 border border-white/10 rounded-full self-start">
          退出登录
        </button>
      </div>

      {/* 数据概览 */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "我的提问", value: questions.length, color: "#3eb489" },
          { label: "我的回答", value: answersList.length, color: "#60a5fa" },
          { label: "答题正确率", value: quizStats ? `${quizStats.accuracy}%` : "—", sub: quizStats ? `${quizStats.correct}/${quizStats.total}` : "", color: "#fbbf24" },
        ].map(s => (
          <div key={s.label} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 text-center">
            <p className="text-3xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
            {s.sub && <p className="text-[10px] text-white/25 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* 继续收听 */}
      {continueList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">继续收听</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {continueList.map((item: any) => {
              const ep = item.episode
              const pct = Math.min(100, item.position / ep.duration * 100)
              return (
                <Link key={ep.id} href={`/episodes/${ep.id}`}>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-[#3eb489]/30 transition-all">
                    <div className="flex gap-3 items-center">
                      {ep.coverUrl
                        ? <img src={ep.coverUrl} className="w-12 h-12 rounded-lg object-cover" />
                        : <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center">🎙</div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white font-medium line-clamp-1">{ep.title}</p>
                        <p className="text-xs text-white/30">{formatDuration(item.position)} / {formatDuration(ep.duration)}</p>
                      </div>
                    </div>
                    <div className="h-1 bg-white/10 rounded-full mt-3">
                      <div className="h-1 bg-[#3eb489] rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 我的提问 */}
      {questions.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">我的提问</h2>
          <div className="space-y-2">
            {questions.map((q: any) => (
              <Link key={q.id} href={`/qa/${q.id}`}>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all flex items-center justify-between">
                  <p className="text-sm text-white">{q.title}</p>
                  <span className="text-xs text-white/30 flex-shrink-0 ml-3">{q.answerCount} 回答</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 我的回答 */}
      {answersList.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white">我的回答</h2>
          <div className="space-y-2">
            {answersList.map((a: any) => (
              <Link key={a.id} href={`/qa/${a.question?.id}`}>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all">
                  <p className="text-xs text-white/40 mb-1">回答了：{a.question?.title}</p>
                  <p className="text-sm text-white/80 line-clamp-2">{a.body}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-white/30">
                    <span>▲ {a.voteCount}</span>
                    {a.isCertified && <span className="text-amber-400/70">✓ 官方解读</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {questions.length === 0 && answersList.length === 0 && continueList.length === 0 && (
        <div className="text-center py-16 text-white/25">
          <p className="text-4xl mb-3">🏈</p>
          <p>还没有动态，去逛逛吧</p>
        </div>
      )}
    </main>
  )
}
