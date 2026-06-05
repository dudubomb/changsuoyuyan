"use client"
import { useState } from "react"
import { useScoreboard, useNFLNews, useStandings } from "../lib/hooks"
import GameDetailModal from "./GameDetailModal"

function GameCard({ g, onClick }: { g: any; onClick: () => void }) {
  const isLive = g.state === "in"
  const isPost = g.state === "post"
  const Team = ({ t, won }: { t: any; won?: boolean }) => (
    <div className="flex items-center gap-2 flex-1 min-w-0">
      {t?.logo && <img src={t.logo} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
      <span className={`text-sm truncate ${won ? "text-white font-bold" : "text-white/60"}`}>{t?.abbr}</span>
      {(isLive || isPost) && (
        <span className={`text-sm font-bold ml-auto ${won ? "text-white" : "text-white/40"}`}>{t?.score}</span>
      )}
    </div>
  )
  const homeWon = isPost && Number(g.home?.score) > Number(g.away?.score)
  const awayWon = isPost && Number(g.away?.score) > Number(g.home?.score)

  return (
    <button onClick={onClick}
      className="text-left w-full bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 hover:border-[#3eb489]/40 hover:bg-white/8 transition-all backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
          isLive ? "bg-red-500/20 text-red-400 border border-red-400/30 animate-pulse"
                 : isPost ? "bg-white/8 text-white/40" : "bg-[#3eb489]/15 text-[#a8edcf] border border-[#3eb489]/20"
        }`}>
          {isLive ? "🔴 LIVE" : isPost ? "已结束" : g.detail}
        </span>
        <span className="text-[10px] text-white/20">详情 ›</span>
      </div>
      <Team t={g.away} won={awayWon} />
      <Team t={g.home} won={homeWon} />
    </button>
  )
}

function StandingsTable({ conf }: { conf: any }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-xl">
      <div className="px-4 py-2 border-b border-white/8 flex items-center justify-between">
        <span className="text-xs font-bold text-white">{conf.name}</span>
        <span className="text-[10px] text-white/30">W-L · 净胜分</span>
      </div>
      <div className="divide-y divide-white/5">
        {conf.teams.slice(0, 8).map((t: any, i: number) => (
          <div key={t.abbr} className="flex items-center gap-2 px-4 py-1.5 hover:bg-white/5 transition-colors">
            <span className="text-[10px] text-white/25 w-4">{i + 1}</span>
            {t.logo && <img src={t.logo} alt="" className="w-5 h-5 object-contain" />}
            <span className="text-xs text-white/80 flex-1">{t.abbr}</span>
            <span className="text-xs text-white/60 font-mono">{t.wins}-{t.losses}{Number(t.ties) > 0 ? `-${t.ties}` : ""}</span>
            <span className={`text-xs font-mono w-12 text-right ${String(t.diff).startsWith("+") ? "text-green-400/70" : "text-red-400/60"}`}>{t.diff}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function NFLDashboard() {
  const { data: sb, isLoading: sbLoading }   = useScoreboard()
  const { data: news = [], isLoading: newsLoading } = useNFLNews()
  const { data: standings = [] }             = useStandings()
  const [openGame, setOpenGame] = useState<string | null>(null)

  const games = sb?.data ?? []

  return (
    <div className="space-y-8">
      {/* 赛程 / 比分 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
            赛程 · 比分 {sb?.week ? `· Week ${sb.week}` : ""}
          </p>
          <span className="text-[10px] text-white/20">点击查看详情 · 实时更新</span>
        </div>
        {sbLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
          </div>
        ) : games.length === 0 ? (
          <p className="text-sm text-white/25 text-center py-6">本周暂无赛程</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {games.slice(0, 8).map((g: any) => <GameCard key={g.id} g={g} onClick={() => setOpenGame(g.id)} />)}
          </div>
        )}
      </section>

      {/* 排名榜 */}
      {standings.length > 0 && (
        <section>
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">排名榜</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {standings.map((conf: any) => <StandingsTable key={conf.name} conf={conf} />)}
          </div>
        </section>
      )}

      {/* 热点新闻 */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30 mb-4">热点新闻</p>
        {newsLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {news.slice(0, 6).map((n: any, i: number) => (
              <a key={i} href={n.link} target="_blank" rel="noopener noreferrer">
                <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-all backdrop-blur-xl flex gap-3 h-full">
                  {n.image && <img src={n.image} alt="" className="w-24 h-full object-cover flex-shrink-0" />}
                  <div className="flex-1 min-w-0 p-3">
                    {n.category && <span className="text-[10px] text-[#a8edcf]/60 uppercase tracking-wide">{n.category}</span>}
                    <p className="text-sm text-white font-medium leading-snug line-clamp-2 mt-0.5">{n.headline}</p>
                    {n.description && <p className="text-xs text-white/35 line-clamp-2 mt-1">{n.description}</p>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* 比赛详情弹窗 */}
      {openGame && <GameDetailModal gameId={openGame} onClose={() => setOpenGame(null)} />}
    </div>
  )
}
