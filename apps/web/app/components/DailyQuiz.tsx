"use client"
import { useState } from "react"
import Link from "next/link"
import { useDailyQuiz, useSubmitDaily } from "../lib/hooks"
import { useAuthStore } from "../lib/auth-store"

const DIFF_LABEL: Record<string, { txt: string; color: string }> = {
  easy:   { txt: "简单", color: "text-green-400 bg-green-400/10 border-green-400/20" },
  medium: { txt: "中等", color: "text-amber-400 bg-amber-400/10 border-amber-400/20" },
  hard:   { txt: "困难", color: "text-red-400 bg-red-400/10 border-red-400/20" },
}

export default function DailyQuiz() {
  const { data: quiz, isLoading } = useDailyQuiz()
  const submit                    = useSubmitDaily()
  const { user }                  = useAuthStore()
  const [selected, setSelected]   = useState<number | null>(null)
  const [result, setResult]       = useState<{ isCorrect: boolean; correctIdx: number; explanation: string } | null>(null)

  if (isLoading || !quiz) return (
    <div className="rounded-2xl p-5 bg-amber-400/5 border border-amber-400/15 animate-pulse h-40" />
  )

  // 已答过（从后端拿到的状态）或刚提交
  const answered = result ?? (quiz.myAnswer ? {
    isCorrect:   quiz.myAnswer.isCorrect,
    correctIdx:  quiz.correctIdx,
    explanation: quiz.explanation,
  } : null)
  const myChoice = result ? selected : quiz.myAnswer?.choice
  const diff = DIFF_LABEL[quiz.difficulty] ?? DIFF_LABEL.medium

  const handleSubmit = async () => {
    if (selected === null || !user) return
    try {
      const res = await submit.mutateAsync({ id: quiz.id, choice: selected })
      setResult(res)
    } catch (err: any) {
      // 409 = 已作答过，用后端返回的已有答案显示结果
      const d = err?.response?.data?.data
      if (err?.response?.status === 409 && d) {
        setResult({ isCorrect: d.myChoice === d.correctIdx, correctIdx: d.correctIdx, explanation: d.explanation })
      }
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl p-5"
      style={{ border: "1px solid rgba(251,191,36,0.25)", boxShadow: "0 0 30px rgba(217,119,6,0.15)" }}
    >
      {/* 赛场背景 */}
      <div className="absolute inset-0 z-0"
        style={{ backgroundImage: "url('/daily-bg.jpg')", backgroundSize: "cover", backgroundPosition: "center", filter: "brightness(0.35)" }}
      />
      <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.7))" }} />

      {/* 头部 */}
      <div className="relative z-10 flex items-center gap-2 mb-3">
        <span className="text-lg">🏆</span>
        <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">每日一题</span>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${diff.color}`}>{diff.txt}</span>
        {quiz.totalAnswers > 0 && (
          <span className="ml-auto text-xs text-white/40">{quiz.totalAnswers} 人已答</span>
        )}
      </div>

      {/* 题目 */}
      <p className="relative z-10 text-white font-semibold text-sm leading-relaxed mb-4">{quiz.question}</p>

      {/* 选项 */}
      <div className="relative z-10 flex flex-col gap-2 mb-3">
        {quiz.options.map((opt: string, i: number) => {
          const isCorrect    = answered && i === answered.correctIdx
          const isMyWrong    = answered && i === myChoice && !answered.isCorrect
          const isSelected   = !answered && selected === i

          let cls = "bg-black/30 border-white/15 text-white/70 hover:border-amber-400/40 hover:bg-amber-400/10"
          if (isSelected)  cls = "bg-amber-400/20 border-amber-400/50 text-white"
          if (isCorrect)   cls = "bg-green-500/20 border-green-400/50 text-green-200"
          if (isMyWrong)   cls = "bg-red-500/20 border-red-400/50 text-red-200"

          return (
            <button
              key={i}
              disabled={!!answered || !user}
              onClick={() => setSelected(i)}
              className={`text-xs text-left px-3 py-2 rounded-lg border transition-all backdrop-blur-sm flex items-center gap-2 ${cls} ${answered ? "cursor-default" : ""}`}
            >
              <span className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {isCorrect && <span className="text-green-400">✓</span>}
              {isMyWrong && <span className="text-red-400">✕</span>}
              {answered && quiz.distribution && (
                <span className="text-[10px] text-white/30">{quiz.distribution[i]}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* 提交 / 结果 */}
      <div className="relative z-10">
        {!user ? (
          <Link href="/login" className="block text-center text-xs text-amber-300/70 hover:text-amber-300 py-2">
            登录后作答 →
          </Link>
        ) : !answered ? (
          <button
            onClick={handleSubmit}
            disabled={selected === null || submit.isPending}
            className="w-full text-sm font-semibold bg-amber-500/90 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl transition-colors"
          >
            {submit.isPending ? "提交中..." : "提交答案"}
          </button>
        ) : (
          <div className="space-y-2">
            <div className={`text-sm font-bold ${answered.isCorrect ? "text-green-400" : "text-red-400"}`}>
              {answered.isCorrect ? "🎉 回答正确！" : "❌ 回答错误"}
            </div>
            <div className="bg-black/40 border border-white/10 rounded-lg p-3 backdrop-blur-sm">
              <p className="text-xs font-semibold text-amber-400/80 mb-1">📖 答案解析</p>
              <p className="text-xs text-white/60 leading-relaxed">{answered.explanation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
