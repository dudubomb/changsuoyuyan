"use client"
import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"
import { usePlayer, useRatePlayer, useRelatedPlayers } from "../../lib/hooks"
import { useAuthStore } from "../../lib/auth-store"
import RadarChart from "../../components/RadarChart"

// 根据位置 + 赛季数据生成能力矩阵
function getAbilityMatrix(position: string, stats?: any) {
  const s = stats?.[0] ?? {}

  // 根据真实数据做归一化评估
  const qbRating  = Math.min(100, ((s.passerRating ?? 90) / 158) * 100)
  const tdPer16   = Math.min(100, ((s.touchdowns ?? 20) / 16) * (16 / (s.matches || 16)) * 80)
  const compPct   = s.completions && s.attempts ? Math.min(100, (s.completions / s.attempts) * 130) : 65
  const yardsPer  = s.yards && s.matches ? Math.min(100, (s.yards / s.matches / 350) * 100) : 60

  const matrixMap: Record<string, { label: string; value: number }[]> = {
    QB: [
      { label: "传球精准", value: Math.round(compPct) },
      { label: "手臂力量", value: Math.round(75 + Math.random() * 15) },
      { label: "机动性",   value: Math.round(55 + Math.random() * 20) },
      { label: "决策力",   value: Math.round(qbRating) },
      { label: "关键时刻", value: Math.round(70 + Math.random() * 25) },
      { label: "领导力",   value: Math.round(75 + Math.random() * 20) },
    ],
    WR: [
      { label: "速度",     value: Math.round(75 + Math.random() * 20) },
      { label: "跑位技术", value: Math.round(70 + Math.random() * 25) },
      { label: "接球能力", value: Math.round(tdPer16 + 30) },
      { label: "YAC",      value: Math.round(65 + Math.random() * 25) },
      { label: "身体对抗", value: Math.round(55 + Math.random() * 30) },
      { label: "大场面",   value: Math.round(yardsPer + 10) },
    ],
    TE: [
      { label: "接球",     value: Math.round(tdPer16 + 25) },
      { label: "封堵",     value: Math.round(65 + Math.random() * 20) },
      { label: "速度",     value: Math.round(60 + Math.random() * 25) },
      { label: "跑位",     value: Math.round(68 + Math.random() * 22) },
      { label: "红区威胁", value: Math.round(tdPer16 + 20) },
      { label: "多样性",   value: Math.round(70 + Math.random() * 20) },
    ],
    RB: [
      { label: "速度爆发", value: Math.round(75 + Math.random() * 20) },
      { label: "力量",     value: Math.round(65 + Math.random() * 25) },
      { label: "接球",     value: Math.round(60 + Math.random() * 25) },
      { label: "挡人",     value: Math.round(55 + Math.random() * 25) },
      { label: "视野",     value: Math.round(70 + Math.random() * 20) },
      { label: "持久力",   value: Math.round(65 + Math.random() * 25) },
    ],
    LB: [
      { label: "速度",     value: Math.round(70 + Math.random() * 20) },
      { label: "擒抱",     value: Math.round(s.tackles ? Math.min(95, s.tackles * 1.2) : 75) },
      { label: "覆盖",     value: Math.round(60 + Math.random() * 25) },
      { label: "传球干扰", value: Math.round(s.sacks ? Math.min(95, s.sacks * 6) : 70) },
      { label: "领导力",   value: Math.round(70 + Math.random() * 25) },
      { label: "本能",     value: Math.round(75 + Math.random() * 20) },
    ],
    DL: [
      { label: "力量",     value: Math.round(80 + Math.random() * 15) },
      { label: "速度",     value: Math.round(70 + Math.random() * 20) },
      { label: "传球冲击", value: Math.round(s.sacks ? Math.min(97, s.sacks * 6) : 75) },
      { label: "跑防",     value: Math.round(75 + Math.random() * 15) },
      { label: "技术",     value: Math.round(70 + Math.random() * 20) },
      { label: "引擎",     value: Math.round(80 + Math.random() * 15) },
    ],
  }

  return matrixMap[position] ?? matrixMap["QB"]
}

export default function PlayerDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const { user } = useAuthStore()
  const { data: player, isLoading } = usePlayer(id)
  const { data: related = [] }      = useRelatedPlayers(id)
  const ratePlayer = useRatePlayer(id)

  const [myScore, setMyScore]     = useState(0)
  const [myComment, setMyComment] = useState("")
  const [hovered, setHovered]     = useState(0)
  const [rated, setRated]         = useState(false)

  if (isLoading) return (
    <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-4">
      {[1,2,3].map(i => <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 animate-pulse h-40" />)}
    </main>
  )

  if (!player) return (
    <main className="max-w-5xl mx-auto px-6 py-10 text-center text-white/30">
      <p className="text-5xl mb-3">🏈</p><p>球员不存在</p>
    </main>
  )

  const abilities  = getAbilityMatrix(player.position, player.stats)
  const teamColor  = player.team?.primaryColor ?? "#3eb489"
  const latestStat = player.stats?.[0]

  const handleRate = async () => {
    if (!myScore) return
    await ratePlayer.mutateAsync({ score: myScore, comment: myComment })
    setRated(true)
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 w-full space-y-6">
      <Link href="/players" className="text-sm text-white/30 hover:text-white/60 transition-colors block">← 返回球员列表</Link>

      {/* 头部 — 照片 banner */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10"
        style={{ background: `linear-gradient(120deg, ${teamColor}40 0%, #0a0a0a 65%)` }}>
        {/* 球队 logo 水印 */}
        {player.team?.abbreviation && (
          <img
            src={`https://a.espncdn.com/i/teamlogos/nfl/500/${player.team.abbreviation.toLowerCase()}.png`}
            alt=""
            className="absolute -right-8 -top-8 w-48 h-48 object-contain opacity-10 pointer-events-none"
          />
        )}
        <div className="relative flex items-end gap-3 sm:gap-6 p-4 sm:p-6">
          {/* 球员照片 */}
          <div className="relative flex-shrink-0 w-24 h-24 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2"
            style={{ borderColor: `${teamColor}80`, background: `${teamColor}25` }}>
            {player.avatarUrl ? (
              <img
                src={player.avatarUrl}
                alt={player.name}
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  const img = e.target as HTMLImageElement
                  if (player.team?.abbreviation && !img.dataset.fb) {
                    img.dataset.fb = "1"
                    img.src = `https://a.espncdn.com/i/teamlogos/nfl/500/${player.team.abbreviation.toLowerCase()}.png`
                    img.className = "w-2/3 h-2/3 m-auto object-contain opacity-40 absolute inset-0"
                  } else img.style.display = "none"
                }}
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-4xl font-black text-white/30">
                {player.jersey ?? "🏈"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-white truncate">{player.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: teamColor }} />
                  <p className="text-xs sm:text-base text-white/40 truncate">{player.position} · {player.team?.name}</p>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    player.age       && { icon: "🎂", label: "年龄",   value: `${player.age} 岁` },
                    player.height    && { icon: "📏", label: "身高",   value: player.height },
                    player.weight    && { icon: "⚖️", label: "体重",   value: player.weight },
                    player.college   && { icon: "🎓", label: "大学",   value: player.college },
                    player.draftYear && { icon: "📋", label: "选秀",   value: `${player.draftYear} · 第${player.draftRound}轮 第${player.draftPick}签` },
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1">
                      <span className="text-xs">{item.icon}</span>
                      <span className="text-xs text-white/35">{item.label}</span>
                      <span className="text-xs font-medium text-white/70">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-amber-400">{player.communityRating ?? "—"}</p>
                <p className="text-xs text-white/25">{player.ratingCount} 人评分</p>
              </div>
            </div>
            {player.bio && <p className="text-sm text-white/45 leading-relaxed mt-3">{player.bio}</p>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* 左：能力矩阵 */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">能力矩阵</h2>
            <span className="text-xs text-white/25 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
              {player.stats?.[0]?.season ?? "2024"} 赛季
            </span>
          </div>
          <div className="flex justify-center py-2 px-4">
            <RadarChart stats={abilities} color={teamColor} size={260} />
          </div>
          {/* 能力条形补充 */}
          <div className="space-y-2 pt-2">
            {abilities.map(a => (
              <div key={a.label} className="flex items-center gap-3">
                <span className="text-xs text-white/40 w-16 flex-shrink-0 text-right">{a.label}</span>
                <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all duration-500"
                    style={{ width: `${a.value}%`, background: teamColor, opacity: 0.8 }}
                  />
                </div>
                <span className="text-xs font-mono w-7 text-right" style={{ color: teamColor }}>{a.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 右：赛季数据 + 评分 */}
        <div className="space-y-5">

          {/* 赛季数据 */}
          {latestStat && (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-semibold text-white">赛季数据 · {latestStat.season}</h2>
              <div className="grid grid-cols-3 gap-3 text-xs">
                {[
                  { label: "出场", value: latestStat.matches },
                  { label: "触地", value: latestStat.touchdowns, color: "text-green-400/80" },
                  { label: "码数", value: latestStat.yards?.toLocaleString() },
                  latestStat.passerRating && { label: "传球效率", value: latestStat.passerRating },
                  latestStat.completions  && { label: "完成传球", value: latestStat.completions },
                  latestStat.sacks        && { label: "擒杀", value: latestStat.sacks },
                  latestStat.tackles      && { label: "擒抱", value: latestStat.tackles },
                  latestStat.receptions   && { label: "接球次数", value: latestStat.receptions },
                  latestStat.interceptions > 0 && { label: "失误", value: latestStat.interceptions, color: "text-red-400/70" },
                ].filter(Boolean).map((s: any) => (
                  <div key={s.label} className="bg-white/5 border border-white/8 rounded-xl p-3 text-center">
                    <p className="text-white/30 mb-1">{s.label}</p>
                    <p className={`font-bold text-base ${s.color ?? "text-white"}`}>{s.value ?? "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 社区评分 */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-semibold text-white">社区评分</h2>

            {/* 最近评价 */}
            {player.ratings?.slice(0,3).map((r: any) => (
              <div key={r.id} className="flex items-start gap-3">
                <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {r.user?.nickname?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-white">{r.user?.nickname}</span>
                    <span className="text-sm font-bold text-amber-400">{r.score}/10</span>
                  </div>
                  {r.comment && <p className="text-xs text-white/40 mt-0.5">{r.comment}</p>}
                </div>
              </div>
            ))}

            {/* 评分输入 */}
            {user && !rated && (
              <div className="border-t border-white/8 pt-4 space-y-3">
                <p className="text-xs text-white/40">你的评分</p>
                <div className="flex gap-1">
                  {[1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button
                      key={n}
                      onMouseEnter={() => setHovered(n)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setMyScore(n)}
                      className={`flex-1 h-8 rounded text-xs font-bold transition-all ${
                        n <= (hovered || myScore)
                          ? "bg-amber-500/80 text-white"
                          : "bg-white/5 border border-white/10 text-white/30"
                      }`}
                    >{n}</button>
                  ))}
                </div>
                <input
                  value={myComment}
                  onChange={e => setMyComment(e.target.value)}
                  placeholder="写点评（可选）"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-white/25"
                />
                <button
                  onClick={handleRate}
                  disabled={!myScore || ratePlayer.isPending}
                  className="w-full text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/20 text-amber-300 py-2 rounded-lg transition-colors disabled:opacity-40"
                >
                  {ratePlayer.isPending ? "提交中..." : "提交评分"}
                </button>
              </div>
            )}
            {rated && <p className="text-xs text-[#a8edcf]/70 text-center">✓ 评分已提交</p>}
          </div>
        </div>
      </div>

      {/* 相关球员 */}
      {related.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">相关球员</h2>
            <span className="text-xs text-white/30">同位置 · {player.position}</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {related.map((r: any) => (
              <Link key={r.id} href={`/players/${r.id}`}>
                <div className="card-snappy relative overflow-hidden rounded-2xl cursor-pointer aspect-[3/4] group"
                  style={{
                    background: r.team?.primaryColor ? `linear-gradient(165deg, ${r.team.primaryColor}60, #0c0c0e 60%)` : "#0c0c0e",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.4)",
                  }}>
                  {r.team?.abbreviation && (
                    <img src={`https://a.espncdn.com/i/teamlogos/nfl/500/${r.team.abbreviation.toLowerCase()}.png`}
                      alt="" className="absolute -right-4 -top-4 w-20 h-20 object-contain opacity-[0.08] pointer-events-none" />
                  )}
                  {r.avatarUrl && (
                    <img src={r.avatarUrl} alt={r.name} loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover object-top opacity-95 group-hover:scale-[1.07] transition-transform duration-700"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement
                        if (r.team?.abbreviation && !img.dataset.fb) {
                          img.dataset.fb = "1"
                          img.src = `https://a.espncdn.com/i/teamlogos/nfl/500/${r.team.abbreviation.toLowerCase()}.png`
                          img.className = "absolute inset-0 w-[55%] h-[55%] m-auto object-contain opacity-20"
                        } else img.style.display = "none"
                      }} />
                  )}
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.5) 30%, transparent 55%)" }} />
                  <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.08)" }} />
                  {r.communityRating && (
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-0.5 bg-black/55 backdrop-blur-md border border-amber-400/30 rounded-full px-1.5 py-0.5">
                      <span className="text-amber-400 text-[9px]">★</span>
                      <span className="text-amber-300 font-bold text-[11px] leading-none">{r.communityRating}</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider text-white"
                      style={{ background: `${r.team?.primaryColor ?? "#3eb489"}cc` }}>
                      {r.position}
                    </span>
                    <p className="font-bold text-white text-sm leading-tight drop-shadow-lg mt-1.5">{r.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}
