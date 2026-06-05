"use client"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useInfinitePlayers, useTeams } from "../lib/hooks"

const POSITIONS = ["全部", "QB", "WR", "TE", "RB", "LB", "DL", "CB", "S"]

export default function PlayersPage() {
  const [position, setPosition]   = useState("全部")
  const [teamId, setTeamId]       = useState<string | undefined>()
  const [q, setQ]                 = useState("")
  const [search, setSearch]       = useState("")
  const [showTeams, setShowTeams] = useState(false)

  const {
    data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useInfinitePlayers(position === "全部" ? undefined : position, teamId, search || undefined)
  const { data: teams = [] }    = useTeams()

  const rawPlayers = data?.pages.flatMap(p => p.data) ?? []
  // 去重（防分页边界重复）
  const players = Array.from(new Map(rawPlayers.map((p: any) => [p.id, p])).values())
  const total   = data?.pages[0]?.meta.total ?? 0

  // 触底自动加载
  const sentinelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage() },
      { rootMargin: "400px" }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // 按联盟分组球队

  const selectedTeam = teams.find((t: any) => t.id === teamId)

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-6">

      {/* 顶栏 */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">球员分析</h1>
        <form onSubmit={e => { e.preventDefault(); setSearch(q) }}>
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="搜索球员..."
            className="bg-white/5 border border-white/10 text-sm text-white placeholder-white/25 rounded-lg px-4 py-2 focus:outline-none focus:border-white/30 w-44"
          />
        </form>
      </div>

      {/* 位置筛选 */}
      <div className="flex gap-2 flex-wrap">
        {POSITIONS.map(pos => (
          <button key={pos} onClick={() => setPosition(pos)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              position === pos
                ? "bg-white/15 border-white/25 text-white font-medium"
                : "bg-white/5 border-white/10 text-white/40 hover:border-white/25 hover:text-white"
            }`}
          >{pos}</button>
        ))}
      </div>

      {/* 球队筛选 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowTeams(!showTeams)}
            className={`flex items-center gap-2 text-xs px-4 py-2 rounded-full border transition-all ${
              teamId
                ? "bg-[#3eb489]/15 border-[#3eb489]/40 text-[#a8edcf]"
                : "bg-white/5 border-white/10 text-white/50 hover:border-white/25 hover:text-white"
            }`}
          >
            {selectedTeam ? (
              <>
                <img src={`https://a.espncdn.com/i/teamlogos/nfl/500/${selectedTeam.abbreviation.toLowerCase()}.png`}
                  alt="" className="w-4 h-4 object-contain" />
                {selectedTeam.shortName}
              </>
            ) : "🏟 按球队筛选"}
            <span className="opacity-50">{showTeams ? "▲" : "▼"}</span>
          </button>

          {teamId && (
            <button onClick={() => setTeamId(undefined)}
              className="text-xs text-white/30 hover:text-white/60 transition-colors">
              清除 ✕
            </button>
          )}
        </div>

        {/* 球队下拉面板 — 按分区 */}
        {showTeams && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-6">
            {["AFC", "NFC"].map(conf => (
              <div key={conf}>
                <p className="text-xs font-bold uppercase tracking-widest mb-3"
                  style={{ color: conf === "AFC" ? "rgba(239,68,68,0.6)" : "rgba(59,130,246,0.6)" }}>
                  {conf}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {["East", "North", "South", "West"].map(div => {
                    const divTeams = teams.filter((t: any) => t.division === `${conf} ${div}`)
                    if (!divTeams.length) return null
                    return (
                      <div key={div} className="space-y-1.5">
                        <p className="text-[10px] font-semibold text-white/25 uppercase tracking-wider px-1">{div}</p>
                        {divTeams.map((t: any) => {
                          const active = teamId === t.id
                          return (
                            <button
                              key={t.id}
                              onClick={() => { setTeamId(active ? undefined : t.id); setShowTeams(false) }}
                              className="card-snappy w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border transition-all text-left overflow-hidden relative"
                              style={{
                                borderColor: active ? `${t.primaryColor}` : "rgba(255,255,255,0.08)",
                                background: active
                                  ? `linear-gradient(110deg, ${t.primaryColor}40, rgba(255,255,255,0.03))`
                                  : "rgba(255,255,255,0.02)",
                              }}
                            >
                              {/* logo */}
                              <img
                                src={`https://a.espncdn.com/i/teamlogos/nfl/500/${t.abbreviation.toLowerCase()}.png`}
                                alt={t.shortName}
                                className="w-6 h-6 object-contain flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0" }}
                              />
                              <span className={`text-xs truncate ${active ? "text-white font-semibold" : "text-white/60"}`}>
                                {t.shortName}
                              </span>
                              {active && (
                                <span className="ml-auto text-[10px] flex-shrink-0" style={{ color: t.primaryColor }}>✓</span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 总数 */}
      {total > 0 && (
        <p className="text-xs text-white/30">共 {total.toLocaleString()} 名球员</p>
      )}

      {/* 球员网格 */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1,2,3,4,5,6,7,8].map(i => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-2xl animate-pulse aspect-[3/4]" />
          ))}
        </div>
      ) : players.length === 0 ? (
        <div className="text-center py-20 text-white/25">
          <p className="text-4xl mb-3">🏈</p>
          <p>没有找到球员</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {players.map((p: any) => (
            <Link key={p.id} href={`/players/${p.id}`}>
              <div
                className="card-snappy relative overflow-hidden rounded-2xl cursor-pointer aspect-[3/4] group"
                style={{
                  background: p.team?.primaryColor ? `linear-gradient(165deg, ${p.team.primaryColor}60 0%, #0c0c0e 60%)` : "#0c0c0e",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.4)",
                }}
              >
                {/* 球队 logo 水印（右上角，淡） */}
                {p.team?.abbreviation && (
                  <img
                    src={`https://a.espncdn.com/i/teamlogos/nfl/500/${p.team.abbreviation.toLowerCase()}.png`}
                    alt=""
                    className="absolute -right-5 -top-5 w-24 h-24 object-contain opacity-[0.08] pointer-events-none"
                  />
                )}

                {/* 球员照片 */}
                {p.avatarUrl && (
                  <img
                    src={p.avatarUrl}
                    alt={p.name}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-top opacity-95 group-hover:scale-[1.07] transition-transform duration-700 ease-out"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      if (p.team?.abbreviation && !img.dataset.fallback) {
                        img.dataset.fallback = "1"
                        img.src = `https://a.espncdn.com/i/teamlogos/nfl/500/${p.team.abbreviation.toLowerCase()}.png`
                        img.className = "absolute inset-0 w-[55%] h-[55%] m-auto object-contain opacity-20"
                      } else img.style.display = "none"
                    }}
                  />
                )}
                {/* 无照片时的大球衣号水印 */}
                {!p.avatarUrl && p.jersey && (
                  <span className="absolute inset-0 flex items-center justify-center text-white/[0.07] font-black select-none"
                    style={{ fontSize: "7rem" }}>
                    {p.jersey}
                  </span>
                )}

                {/* 底部渐变遮罩 */}
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 30%, transparent 55%)" }}
                />

                {/* hover 光晕边框 */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                  style={{ boxShadow: `inset 0 0 0 1.5px ${p.team?.primaryColor ?? "#3eb489"}aa, 0 0 24px ${p.team?.primaryColor ?? "#3eb489"}33` }}
                />
                {/* 静态细边框 */}
                <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }} />

                {/* 球衣号（左上，带描边） */}
                {p.jersey && (
                  <div className="absolute top-3 left-3.5 leading-none"
                    style={{
                      fontFamily: "var(--font-geist-sans)", fontWeight: 900, fontSize: "1.6rem",
                      color: "rgba(255,255,255,0.95)",
                      textShadow: `0 0 1px ${p.team?.primaryColor ?? "#000"}, 0 2px 4px rgba(0,0,0,0.6)`,
                    }}>
                    {p.jersey}
                  </div>
                )}

                {/* 评分（右上） */}
                {p.communityRating && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/55 backdrop-blur-md border border-amber-400/30 rounded-full px-2 py-0.5">
                    <span className="text-amber-400 text-[10px]">★</span>
                    <span className="text-amber-300 font-bold text-xs leading-none">{p.communityRating}</span>
                  </div>
                )}

                {/* 底部信息 */}
                <div className="absolute bottom-0 left-0 right-0 p-3.5">
                  {/* 位置色条 */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white"
                      style={{ background: `${p.team?.primaryColor ?? "#3eb489"}cc` }}>
                      {p.position}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider text-white/50 font-semibold">
                      {p.team?.shortName ?? "FA"}
                    </span>
                  </div>
                  <p className="font-bold text-white text-[15px] leading-tight drop-shadow-lg group-hover:text-white transition-colors">
                    {p.name}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 无限滚动哨兵 + 加载指示 */}
      {!isLoading && players.length > 0 && (
        <div ref={sentinelRef} className="py-8 flex justify-center">
          {isFetchingNextPage ? (
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <span className="w-4 h-4 border-2 border-white/20 border-t-[#3eb489] rounded-full animate-spin" />
              加载更多...
            </div>
          ) : hasNextPage ? (
            <span className="text-white/20 text-xs">下滑加载更多</span>
          ) : (
            <span className="text-white/20 text-xs">已加载全部 {total.toLocaleString()} 名球员</span>
          )}
        </div>
      )}
    </main>
  )
}
