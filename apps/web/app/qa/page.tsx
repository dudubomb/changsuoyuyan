"use client"
import Link from "next/link"
import { useState } from "react"
import { useQuestions, useCreateQuestion } from "../lib/hooks"
import { useAuthStore } from "../lib/auth-store"
import DailyQuiz from "../components/DailyQuiz"

export default function QAPage() {
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle]       = useState("")
  const [body, setBody]         = useState("")
  const [tags, setTags]         = useState("")
  const [error, setError]       = useState("")

  const { data: questionsData, isLoading } = useQuestions()
  const createQuestion                     = useCreateQuestion()
  const { user }                           = useAuthStore()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await createQuestion.mutateAsync({
        title,
        body,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      })
      setTitle(""); setBody(""); setTags("")
      setShowForm(false)
    } catch (err: any) {
      setError(err.response?.data?.error ?? "提交失败")
    }
  }

  const questions = questionsData?.data ?? []

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">规则问答</h1>
        {user ? (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 text-red-300 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? "取消" : "+ 提问"}
          </button>
        ) : (
          <Link href="/login" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            登录后可提问
          </Link>
        )}
      </div>

      {/* 提问表单 */}
      {showForm && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs text-white/40">问题标题</label>
              <input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Was the roughing-the-passer call correct?"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">详细描述</label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="描述具体情况..."
                required
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-white/40">标签（逗号分隔）</label>
              <input
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="Penalties, QB, Defense"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
              />
            </div>
            {error && <p className="text-red-400/80 text-xs bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit"
              disabled={createQuestion.isPending}
              className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 text-red-300 text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {createQuestion.isPending ? "提交中..." : "发布问题"}
            </button>
          </form>
        </div>
      )}

      {/* 每日一题 */}
      <DailyQuiz />

      {/* 问题列表 */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
          全部问题 {questionsData?.meta?.total ? `(${questionsData.meta.total})` : ""}
        </p>

        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-5 animate-pulse h-24" />
            ))}
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-20 text-white/25">
            <p className="text-4xl mb-3">❓</p>
            <p>还没有问题，来第一个提问吧</p>
          </div>
        ) : (
          questions.map((q: any) => (
            <Link key={q.id} href={`/qa/${q.id}`}>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-5 hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-sm font-semibold text-white leading-snug">{q.title}</h2>
                  {q.hasCertified && (
                    <span className="text-amber-400/80 bg-amber-400/10 border border-amber-400/20 text-xs px-2 py-0.5 rounded-full flex-shrink-0">✓ 官方解读</span>
                  )}
                </div>
                <p className="text-xs text-white/35 line-clamp-2">{q.body}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {q.tags?.map((t: string) => (
                      <span key={t} className="text-xs bg-white/5 border border-white/10 text-white/40 px-2 py-0.5 rounded-full">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-white/25">
                    <span>{q.answerCount ?? 0} 条回答</span>
                    <span>{new Date(q.createdAt).toLocaleDateString("zh-CN")}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </main>
  )
}
