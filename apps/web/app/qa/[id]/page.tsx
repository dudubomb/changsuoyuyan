"use client"
import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"
import { useQuestion, useCreateAnswer, useVoteAnswer } from "../../lib/hooks"
import { useAuthStore } from "../../lib/auth-store"

export default function QADetailPage() {
  const { id }        = useParams<{ id: string }>()
  const [body, setBody] = useState("")
  const [error, setError] = useState("")

  const { data: question, isLoading } = useQuestion(id)
  const createAnswer = useCreateAnswer(id)
  const voteAnswer   = useVoteAnswer()
  const { user }     = useAuthStore()

  const handleAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      await createAnswer.mutateAsync(body)
      setBody("")
    } catch (err: any) {
      setError(err.response?.data?.error ?? "提交失败")
    }
  }

  if (isLoading) return (
    <main className="max-w-3xl mx-auto px-6 py-10 w-full space-y-4">
      {[1,2,3].map(i => <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse h-32" />)}
    </main>
  )

  if (!question) return (
    <main className="max-w-3xl mx-auto px-6 py-10 text-center text-white/30">
      <p className="text-4xl mb-3">❓</p><p>问题不存在</p>
    </main>
  )

  return (
    <main className="max-w-3xl mx-auto px-6 py-10 w-full space-y-6">
      <Link href="/qa" className="text-sm text-white/30 hover:text-white/60 transition-colors block">← 返回问答列表</Link>

      {/* 问题 */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
        <div className="flex gap-2 flex-wrap">
          {question.tags?.map((t: string) => (
            <span key={t} className="text-xs bg-white/5 border border-white/10 text-white/40 px-2 py-0.5 rounded-full">{t}</span>
          ))}
          {question.episodeId && (
            <Link href={`/episodes/${question.episodeId}`} className="text-xs bg-blue-500/10 text-blue-300/70 border border-blue-400/20 px-2 py-0.5 rounded-full hover:bg-blue-500/15 transition-colors">
              🎙 关联播客
            </Link>
          )}
        </div>
        <h1 className="text-xl font-bold text-white leading-snug">{question.title}</h1>
        <p className="text-white/50 text-sm leading-relaxed">{question.body}</p>
        <div className="flex items-center gap-2 text-xs text-white/20">
          <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center font-bold text-white text-xs">
            {question.author?.nickname?.[0]?.toUpperCase()}
          </div>
          <span>{question.author?.nickname}</span>
          <span>·</span>
          <span>{new Date(question.createdAt).toLocaleDateString("zh-CN")}</span>
        </div>
      </div>

      {/* 回答列表 */}
      <div className="space-y-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
          {question.answers?.length ?? 0} 条回答
        </p>

        {question.answers?.length === 0 && (
          <div className="text-center py-10 text-white/25 text-sm">还没有回答，来第一个解答吧</div>
        )}

        {question.answers?.map((a: any) => (
          <div key={a.id} className={`rounded-2xl p-6 space-y-3 border backdrop-blur-xl ${
            a.isCertified ? "bg-amber-400/5 border-amber-400/15" : "bg-white/5 border-white/10"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs text-white font-bold border border-white/10">
                  {a.author?.nickname?.[0]?.toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{a.author?.nickname}</p>
                  <p className="text-xs text-white/30">{a.author?.role}</p>
                </div>
                {a.isCertified && (
                  <span className="text-xs text-amber-400/80 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">✓ 官方解读</span>
                )}
              </div>
              <span className="text-xs text-white/20">{new Date(a.createdAt).toLocaleDateString("zh-CN")}</span>
            </div>

            <p className="text-sm text-white/60 leading-relaxed">{a.body}</p>

            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => user && voteAnswer.mutate(a.id)}
                className={`text-xs flex items-center gap-1 transition-colors ${
                  user ? "text-white/30 hover:text-amber-400" : "text-white/20 cursor-default"
                }`}
              >
                ▲ <span>{a.voteCount}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 回答输入框 */}
      {user ? (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-3">
          <p className="text-sm font-semibold text-white">写下你的回答</p>
          <form onSubmit={handleAnswer} className="space-y-3">
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              placeholder="分享你对这个规则的理解..."
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/25 resize-none"
            />
            {error && <p className="text-red-400/80 text-xs bg-red-400/5 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createAnswer.isPending}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-400/20 text-red-300 text-sm px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {createAnswer.isPending ? "提交中..." : "提交回答"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="text-center py-6 text-white/25 text-sm">
          <Link href="/login" className="text-amber-400/70 hover:text-amber-300 transition-colors">登录</Link> 后才能回答问题
        </div>
      )}
    </main>
  )
}
