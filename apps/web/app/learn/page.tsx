import Link from "next/link"
import type { Metadata } from "next"
import { EXPLAINERS } from "../lib/explainers"

export const metadata: Metadata = {
  title: "NFL 科普干货",
  description: "美式橄榄球新手入门指南 —— 比赛规则、场上位置、季后赛赛制、Fantasy Football 玩法，零基础也能看懂 NFL。",
  alternates: { canonical: "/learn" },
}

export default function LearnPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-10 w-full space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-white">科普干货</h1>
          <span className="text-xs text-[#a8edcf]/60 bg-[#3eb489]/10 border border-[#3eb489]/20 px-2 py-0.5 rounded-full">入门必读</span>
        </div>
        <p className="text-sm text-white/40">零基础看懂美式橄榄球，从规则到玩法一网打尽。</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {EXPLAINERS.map(ex => (
          <Link key={ex.slug} href={`/learn/${ex.slug}`}>
            <div className="group relative overflow-hidden rounded-2xl border border-white/10 hover:border-white/25 transition-all cursor-pointer h-full p-6"
              style={{ background: `linear-gradient(150deg, ${ex.color}22 0%, rgba(12,12,14,0.6) 55%)` }}>
              {/* 大图标水印 */}
              <span className="absolute -right-3 -bottom-4 text-8xl opacity-10 select-none">{ex.icon}</span>

              <div className="relative space-y-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ background: `${ex.color}25`, border: `1px solid ${ex.color}50` }}>
                  {ex.icon}
                </div>
                <h2 className="text-lg font-bold text-white group-hover:text-[#a8edcf] transition-colors leading-snug">{ex.title}</h2>
                <p className="text-sm text-white/45 leading-relaxed line-clamp-2">{ex.desc}</p>
                <div className="flex items-center gap-2 pt-1">
                  {ex.tags.map(t => (
                    <span key={t} className="text-[10px] text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">{t}</span>
                  ))}
                  <span className="text-[10px] text-white/30 ml-auto">📖 {ex.readTime}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
