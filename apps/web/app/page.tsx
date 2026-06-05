"use client"
import Link from "next/link"
import { useEpisodes, useQuestions } from "./lib/hooks"
import SoundCard from "./components/SoundCard"
import DailyQuiz from "./components/DailyQuiz"
import NFLDashboard from "./components/NFLDashboard"
import { EXPLAINERS } from "./lib/explainers"

const WOBBLES = [
  "M70,12 C95,8 128,30 132,60 C136,88 118,122 88,130 C58,138 20,120 12,90 C4,60 20,20 50,13 C57,11 63,13 70,12 Z",
  "M70,10 C100,6 132,28 134,62 C136,94 112,128 82,132 C52,136 16,116 10,84 C4,52 24,16 54,11 C60,10 65,11 70,10 Z",
]

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}


function EpisodeSkeleton() {
  return <div className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse h-40" />
}

export default function Home() {
  const { data: episodesData, isLoading: epLoading } = useEpisodes()
  const { data: questionsData, isLoading: qaLoading } = useQuestions()

  const episodes  = episodesData?.data  ?? []
  const questions = questionsData?.data ?? []
  const latest    = episodes[0]

  return (
    <>
      {/* 全屏视频背景 */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <video autoPlay muted loop playsInline className="w-full h-full object-cover">
          <source src="/hero-bg.mp4" type="video/mp4" />
        </video>
        {/* 轻度暗化遮罩 */}
        <div className="absolute inset-0 bg-black/15" />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.05), rgba(0,0,0,0.3))" }} />
      </div>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 space-y-12 w-full">

      {/* 最新一集 hero */}
      <section>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#a8edcf] bg-[#3eb489]/15 border border-[#3eb489]/30 px-3 py-1 rounded-full">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3eb489] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3eb489]" />
            </span>
            最新一集
          </span>
          <span className="text-xs text-white/30">每周更新</span>
        </div>
        {epLoading ? <EpisodeSkeleton /> : latest ? (
          <Link href={`/episodes/${latest.id}`}>
            <SoundCard className="card-snappy relative bg-white/5 backdrop-blur-xl border border-[#3eb489]/25 rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center gap-4 hover:bg-white/8 hover:border-[#3eb489]/40"
              style={{ boxShadow: "0 0 30px rgba(62,180,137,0.12)" }}>

              {/* NEW 角标 */}
              <span className="absolute -top-2.5 -right-2.5 z-10 text-[10px] font-black uppercase tracking-wider text-white bg-gradient-to-br from-[#3eb489] to-[#2d9e6b] px-2.5 py-1 rounded-full shadow-lg rotate-3">
                NEW
              </span>

              {/* logo 封面 — 顶部 */}
              <div style={{ width: 120, height: 120 }} className="relative flex items-center justify-center">
                <svg viewBox="0 0 140 140" className="absolute inset-0 w-full h-full">
                  <path d={WOBBLES[0]} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                </svg>
                {latest.coverUrl
                  ? <img src={latest.coverUrl} className="relative z-10 w-20 h-20 rounded-2xl object-cover shadow-lg" />
                  : <span className="relative z-10 text-5xl">🏈</span>
                }
              </div>

              {/* 标签 */}
              <div className="flex flex-wrap gap-2 justify-center">
                {latest.tags?.slice(0,3).map((tag: string) => (
                  <span key={tag} className="text-xs bg-blue-500/10 text-blue-300/70 border border-blue-400/20 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>

              {/* 副标题 */}
              {latest.subtitle && <p className="text-white/35 text-xs">{latest.subtitle}</p>}

              {/* 标题 — 独占整行 */}
              <h1 className="text-white px-2" style={{ fontFamily: "var(--font-dancing)", fontSize: "1.9rem", fontWeight: 700, lineHeight: 1.5 }}>
                {latest.title}
              </h1>

              {/* 摘要 */}
              {latest.summary && (
                <p className="text-white/40 text-sm leading-relaxed line-clamp-2 max-w-lg">{latest.summary}</p>
              )}

              {/* 日期 + 时长 */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-xs font-medium text-white/55 bg-white/8 border border-white/10 px-2.5 py-1 rounded-full">
                  📅 {new Date(latest.publishedAt).toLocaleDateString("zh-CN")}
                </span>
                <span className="text-xs font-medium text-[#a8edcf]/80 bg-[#3eb489]/10 border border-[#3eb489]/20 px-2.5 py-1 rounded-full">
                  ⏱ {formatDuration(latest.duration)}
                </span>
              </div>
            </SoundCard>
          </Link>
        ) : null}
      </section>

      {/* NFL 赛事 Dashboard */}
      <NFLDashboard />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* 更多播客 */}
        <section className="md:col-span-2 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">更多播客</p>
          {epLoading ? (
            <div className="space-y-3">{[1,2].map(i => <EpisodeSkeleton key={i} />)}</div>
          ) : (
            episodes.slice(1, 4).map((ep: any, i: number) => (
              <Link key={ep.id} href={`/episodes/${ep.id}`}>
                <SoundCard className="card-snappy bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex gap-4 items-center hover:bg-white/8 hover:border-white/20">
                  {/* mini wobble */}
                  <div className="flex-shrink-0" style={{ width: 72, height: 72 }}>
                    <div className="relative w-full h-full flex items-center justify-center">
                      <svg viewBox="0 0 140 140" className="absolute inset-0 w-full h-full">
                        <path d={WOBBLES[i % 2]} fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
                      </svg>
                      {ep.coverUrl
                        ? <img src={ep.coverUrl} className="relative z-10 w-10 h-10 rounded-lg object-cover" />
                        : <span className="relative z-10 text-2xl">🏈</span>
                      }
                    </div>
                  </div>
                  {/* 文字 */}
                  <div className="flex-1 min-w-0">
                    {ep.subtitle && <p className="text-white/30 text-xs mb-0.5">{ep.subtitle}</p>}
                    <p className="card-title text-white leading-snug line-clamp-2 mb-2" style={{ fontFamily: "var(--font-dancing)", fontSize: "1.1rem", fontWeight: 700 }}>
                      {ep.title}
                    </p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-white/50 bg-white/8 border border-white/10 px-2 py-0.5 rounded-full">
                        📅 {new Date(ep.publishedAt).toLocaleDateString("zh-CN")}
                      </span>
                      <span className="text-xs font-medium text-[#a8edcf]/70 bg-[#3eb489]/10 border border-[#3eb489]/20 px-2 py-0.5 rounded-full">
                        ⏱ {formatDuration(ep.duration)}
                      </span>
                    </div>
                  </div>
                </SoundCard>
              </Link>
            ))
          )}
          <Link href="/episodes" className="block text-center text-xs text-blue-400/60 hover:text-blue-300 transition-colors py-2">
            查看全部播客 →
          </Link>

          {/* NFL 科普 */}
          <div className="pt-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-white/30">小白科普</span>
              <span className="text-[10px] text-[#a8edcf]/50 bg-[#3eb489]/10 border border-[#3eb489]/20 px-2 py-0.5 rounded-full">入门必读</span>
            </div>
            {EXPLAINERS.map((ex) => (
              <Link key={ex.slug} href={`/learn/${ex.slug}`}>
                <div className="card-snappy group bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-xl border border-white/10 hover:border-[#3eb489]/30 rounded-2xl p-4 flex gap-4 items-start cursor-pointer">
                  <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: `${ex.color}22`, border: `1px solid ${ex.color}44` }}>
                    {ex.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-[#a8edcf] transition-colors">{ex.title}</p>
                    <p className="text-xs text-white/40 leading-relaxed mt-0.5 line-clamp-2">{ex.desc}</p>
                    <div className="flex gap-1.5 mt-2">
                      {ex.tags.map(t => (
                        <span key={t} className="text-[10px] text-white/35 bg-white/5 border border-white/8 px-1.5 py-0.5 rounded-full">{t}</span>
                      ))}
                    </div>
                  </div>
                  <span className="text-white/15 group-hover:text-[#3eb489] transition-colors text-sm flex-shrink-0">›</span>
                </div>
              </Link>
            ))}
            <Link href="/learn" className="block text-center text-xs text-[#a8edcf]/60 hover:text-[#a8edcf] transition-colors py-2">
              查看全部科普 →
            </Link>
          </div>
        </section>

        {/* 规则问答 */}
        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">规则问答</p>
          <div className="space-y-3">
            {qaLoading ? (
              [1,2,3].map(i => <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 animate-pulse h-16" />)
            ) : (
              questions.slice(0, 3).map((q: any) => (
                <Link key={q.id} href={`/qa/${q.id}`}>
                  <SoundCard className="card-snappy bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/8 hover:border-white/20">
                    <p className="text-sm text-white leading-snug mb-2">{q.title}</p>
                    <div className="flex items-center gap-2 text-xs text-white/30">
                      <span>{q.answerCount ?? 0} 条回答</span>
                      {q.hasCertified && (
                        <span className="text-amber-400/80 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">✓ 官方解读</span>
                      )}
                    </div>
                  </SoundCard>
                </Link>
              ))
            )}
          </div>
          <Link href="/qa" className="block text-center text-xs text-red-400/60 hover:text-red-300 transition-colors py-2">
            查看全部问答 →
          </Link>

          {/* 每日一题 */}
          <DailyQuiz />
        </section>

      </div>
      </main>
    </>
  )
}
