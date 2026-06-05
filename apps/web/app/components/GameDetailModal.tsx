"use client"
import { useGameDetail } from "../lib/hooks"

export default function GameDetailModal({ gameId, onClose }: { gameId: string; onClose: () => void }) {
  const { data: g, isLoading } = useGameDetail(gameId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}>
      <div className="bg-[#0d0d10] border border-white/15 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}>

        {isLoading || !g ? (
          <div className="p-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-white/20 border-t-[#3eb489] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* 头部比分 */}
            <div className="flex items-center justify-between">
              <button onClick={onClose} className="text-white/40 hover:text-white text-sm">✕ 关闭</button>
              <span className="text-xs text-white/40">{g.detail}</span>
            </div>

            <div className="flex items-center justify-around">
              {g.teams.map((t: any) => (
                <div key={t.abbr} className="flex flex-col items-center gap-2 flex-1">
                  {t.logo && <img src={t.logo} alt="" className="w-16 h-16 object-contain" />}
                  <span className="text-sm font-semibold text-white">{t.abbr}</span>
                  <span className="text-3xl font-black text-white">{t.score ?? "-"}</span>
                  {t.record && <span className="text-xs text-white/30">{t.record}</span>}
                </div>
              ))}
            </div>

            {/* 每节比分 */}
            {g.teams[0]?.linescores?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                <table className="w-full text-center text-sm">
                  <thead>
                    <tr className="text-white/30 text-xs">
                      <th className="text-left pb-1"></th>
                      {g.teams[0].linescores.map((_: any, i: number) => <th key={i} className="pb-1">Q{i+1}</th>)}
                      <th className="pb-1 text-[#a8edcf]">T</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.teams.map((t: any) => (
                      <tr key={t.abbr} className="text-white/70">
                        <td className="text-left font-semibold text-white">{t.abbr}</td>
                        {t.linescores.map((l: string, i: number) => <td key={i}>{l}</td>)}
                        <td className="font-bold text-white">{t.score}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 球队数据对比 */}
            {g.teamStats?.length === 2 && g.teamStats[0].stats?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30">数据对比</p>
                <div className="space-y-1.5">
                  {g.teamStats[0].stats.slice(0, 8).map((s: any, i: number) => {
                    const opp = g.teamStats[1].stats[i]
                    return (
                      <div key={i} className="flex items-center text-xs">
                        <span className="w-14 text-right text-white font-medium">{s.value}</span>
                        <span className="flex-1 text-center text-white/40">{s.label}</span>
                        <span className="w-14 text-left text-white font-medium">{opp?.value}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 关键球员 */}
            {g.leaders?.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30">关键球员</p>
                <div className="space-y-2">
                  {g.leaders.map((cat: any, i: number) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <p className="text-[10px] text-[#a8edcf]/60 uppercase mb-1.5">{cat.category}</p>
                      {cat.leaders.map((l: any, j: number) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          {l.headshot && <img src={l.headshot} alt="" className="w-7 h-7 rounded-full object-cover" />}
                          <span className="text-white">{l.name}</span>
                          <span className="text-white/30 text-xs">{l.team}</span>
                          <span className="ml-auto text-white/60 text-xs">{l.displayValue}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {g.venue && <p className="text-xs text-white/25 text-center">📍 {g.venue}</p>}
          </div>
        )}
      </div>
    </div>
  )
}
