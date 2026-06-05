"use client"
import Link from "next/link"
import { useState } from "react"
import { useEpisodes } from "../lib/hooks"
import SoundCard from "../components/SoundCard"
import SpotlightCanvas from "../components/SpotlightCanvas"

const WOBBLES = [
  "M70,12 C95,8 128,30 132,60 C136,88 118,122 88,130 C58,138 20,120 12,90 C4,60 20,20 50,13 C57,11 63,13 70,12 Z",
  "M70,10 C100,6 132,28 134,62 C136,94 112,128 82,132 C52,136 16,116 10,84 C4,52 24,16 54,11 C60,10 65,11 70,10 Z",
  "M70,14 C92,6 126,32 130,64 C134,94 114,124 84,130 C54,136 18,118 12,86 C6,56 22,18 52,13 C59,11 65,13 70,14 Z",
]

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}


export default function EpisodesPage() {
  const [q, setQ] = useState("")
  const [search, setSearch] = useState("")
  const { data, isLoading } = useEpisodes(1, search || undefined)
  const episodes = data?.data ?? []

  return (
    <>
      {/* Canvas 体积聚光灯背景 */}
      <SpotlightCanvas />

    <main className="relative z-10 max-w-5xl mx-auto px-6 py-10 w-full space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">播客</h1>
        <form onSubmit={e => { e.preventDefault(); setSearch(q) }} className="flex gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜索播客..."
            className="bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 rounded-lg px-4 py-2 focus:outline-none focus:border-white/30 w-44"
          />
        </form>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse h-36" />)}
        </div>
      ) : episodes.length === 0 ? (
        <div className="text-center py-24 text-white/25">
          <p className="text-5xl mb-4">🎙</p>
          <p>还没有播客，从 RSS 导入或手动创建</p>
        </div>
      ) : (
        <>
          {/* 第一集 — 华丽大 banner */}
          <Link href={`/episodes/${episodes[0].id}`}>
            <SoundCard className="card-snappy group relative overflow-hidden rounded-3xl cursor-pointer"
              style={{ minHeight: 280, boxShadow: "0 0 40px rgba(62,180,137,0.15)" }}>

              {/* 背景：放大模糊封面 */}
              {episodes[0].coverUrl && (
                <img src={episodes[0].coverUrl} alt=""
                  className="absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-40 group-hover:scale-125 transition-transform duration-700" />
              )}
              {/* 渐变遮罩 */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(110deg, rgba(8,10,9,0.95) 0%, rgba(8,10,9,0.7) 45%, rgba(62,180,137,0.15) 100%)" }} />
              {/* 发光边框 */}
              <div className="absolute inset-0 rounded-3xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1.5px rgba(62,180,137,0.3)" }} />

              <div className="relative flex flex-col md:flex-row gap-6 items-center p-7 md:p-9">
                {/* 封面 + 大播放键 */}
                <div className="relative flex-shrink-0">
                  <div className="w-40 h-40 rounded-2xl overflow-hidden shadow-2xl ring-1 ring-white/15">
                    {episodes[0].coverUrl
                      ? <img src={episodes[0].coverUrl} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-[#3eb489]/15 flex items-center justify-center text-5xl">🏈</div>}
                  </div>
                  {/* hover 浮现的播放键（仅桌面） */}
                  <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/40 rounded-2xl">
                    <div className="w-16 h-16 rounded-full bg-[#3eb489] flex items-center justify-center shadow-xl"
                      style={{ boxShadow: "0 0 30px rgba(62,180,137,0.6)" }}>
                      <span className="text-white text-xl ml-1">▶</span>
                    </div>
                  </div>
                </div>

                {/* 文字 */}
                <div className="flex-1 min-w-0 space-y-3 text-center md:text-left">
                  {/* 最新标识 */}
                  <div className="flex items-center gap-2 justify-center md:justify-start flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-white bg-gradient-to-r from-[#3eb489] to-[#2d9e6b] px-3 py-1 rounded-full shadow-lg">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      最新一集
                    </span>
                    {episodes[0].tags?.slice(0,2).map((tag: string) => (
                      <span key={tag} className="text-xs bg-white/10 text-white/60 border border-white/15 px-2 py-0.5 rounded-full backdrop-blur">{tag}</span>
                    ))}
                  </div>

                  {episodes[0].subtitle && <p className="text-white/40 text-sm">{episodes[0].subtitle}</p>}
                  <h2 className="text-white line-clamp-2" style={{ fontFamily: "var(--font-dancing)", fontSize: "2.1rem", fontWeight: 700, lineHeight: 1.5 }}>
                    {episodes[0].title}
                  </h2>
                  <p className="text-white/45 text-sm leading-relaxed line-clamp-2 max-w-xl">{episodes[0].summary}</p>

                  <div className="flex items-center gap-2 justify-center md:justify-start pt-1">
                    <span className="text-xs font-medium text-white/70 bg-white/10 border border-white/15 px-3 py-1 rounded-full backdrop-blur">
                      📅 {new Date(episodes[0].publishedAt).toLocaleDateString("zh-CN")}
                    </span>
                    <span className="text-xs font-medium text-[#a8edcf] bg-[#3eb489]/20 border border-[#3eb489]/30 px-3 py-1 rounded-full backdrop-blur">
                      ⏱ {formatDuration(episodes[0].duration)}
                    </span>
                  </div>
                </div>
              </div>
            </SoundCard>
          </Link>

          {/* 其余播客 — 宽卡单列 */}
          {episodes.length > 1 && (
            <div className="space-y-4">
              {episodes.slice(1).map((ep: any, i: number) => (
                <Link key={ep.id} href={`/episodes/${ep.id}`}>
                  <SoundCard className="card-snappy bg-gradient-to-br from-white/[0.07] to-white/[0.02] backdrop-blur-2xl border border-white/12 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center text-center sm:text-left hover:border-[#3eb489]/30 shadow-lg shadow-black/20">
                    {/* 封面 */}
                    <div className="flex-shrink-0" style={{ width: 96, height: 96 }}>
                      <div className="relative w-full h-full flex items-center justify-center">
                        <svg viewBox="0 0 140 140" className="absolute inset-0 w-full h-full">
                          <path d={WOBBLES[i % WOBBLES.length]} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
                        </svg>
                        {ep.coverUrl
                          ? <img src={ep.coverUrl} className="relative z-10 w-14 h-14 rounded-2xl object-cover shadow-md shadow-black/30" />
                          : <span className="relative z-10 text-3xl">🏈</span>
                        }
                      </div>
                    </div>

                    {/* 文字 */}
                    <div className="flex-1 min-w-0 w-full space-y-2">
                      {ep.subtitle && <p className="text-white/35 text-xs tracking-wide">{ep.subtitle}</p>}
                      {/* 标题独占整行 */}
                      <h3 className="card-title text-white" style={{ fontFamily: "var(--font-dancing)", fontSize: "1.35rem", fontWeight: 700, lineHeight: 1.5 }}>
                        {ep.title}
                      </h3>
                      {ep.summary && (
                        <p className="text-white/40 text-sm leading-relaxed line-clamp-2">{ep.summary}</p>
                      )}
                      <div className="flex items-center gap-2 flex-wrap pt-0.5 justify-center sm:justify-start">
                        <span className="text-xs font-medium text-white/55 bg-white/8 border border-white/10 px-2.5 py-1 rounded-full">
                          📅 {new Date(ep.publishedAt).toLocaleDateString("zh-CN")}
                        </span>
                        <span className="text-xs font-medium text-[#a8edcf]/80 bg-[#3eb489]/10 border border-[#3eb489]/20 px-2.5 py-1 rounded-full">
                          ⏱ {formatDuration(ep.duration)}
                        </span>
                      </div>
                    </div>

                  </SoundCard>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </main>
    </>
  )
}
