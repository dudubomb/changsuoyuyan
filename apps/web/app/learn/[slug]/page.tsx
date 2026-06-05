import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { getExplainer, EXPLAINERS } from "../../lib/explainers"

export function generateStaticParams() {
  return EXPLAINERS.map(e => ({ slug: e.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const ex = getExplainer(slug)
  if (!ex) return { title: "科普" }
  return {
    title: ex.title,
    description: ex.desc,
    alternates: { canonical: `/learn/${slug}` },
  }
}

export default async function ExplainerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ex = getExplainer(slug)
  if (!ex) notFound()

  const others = EXPLAINERS.filter(e => e.slug !== slug).slice(0, 3)

  return (
    <main className="max-w-2xl mx-auto px-6 py-10 w-full space-y-8">
      <Link href="/learn" className="text-sm text-white/30 hover:text-white/60 transition-colors block">← 返回科普</Link>

      {/* 头部 */}
      <div className="relative overflow-hidden rounded-2xl p-7 border border-white/10"
        style={{ background: `linear-gradient(140deg, ${ex.color}30 0%, rgba(12,12,14,0.5) 60%)` }}>
        <span className="absolute -right-4 -bottom-6 text-9xl opacity-10 select-none">{ex.icon}</span>
        <div className="relative space-y-3">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: `${ex.color}25`, border: `1px solid ${ex.color}55` }}>
            {ex.icon}
          </div>
          <h1 className="text-2xl font-bold text-white leading-snug">{ex.title}</h1>
          <div className="flex items-center gap-2">
            {ex.tags.map(t => (
              <span key={t} className="text-xs text-white/50 bg-white/8 border border-white/10 px-2 py-0.5 rounded-full">{t}</span>
            ))}
            <span className="text-xs text-white/30 ml-auto">📖 {ex.readTime}阅读</span>
          </div>
        </div>
      </div>

      {/* 正文 */}
      <article className="space-y-5">
        {ex.body.map((block, i) => {
          if (block.type === "h2") return (
            <h2 key={i} className="text-lg font-bold text-white pt-3 flex items-center gap-2">
              <span className="w-1 h-5 rounded-full" style={{ background: ex.color }} />
              {block.text}
            </h2>
          )
          if (block.type === "p") return (
            <p key={i} className="text-[15px] text-white/60 leading-7">{block.text}</p>
          )
          if (block.type === "tip") return (
            <div key={i} className="flex gap-3 rounded-xl p-4 border"
              style={{ background: `${ex.color}12`, borderColor: `${ex.color}30` }}>
              <span className="text-lg">💡</span>
              <p className="text-sm leading-relaxed" style={{ color: `${ex.color}` }}>{block.text}</p>
            </div>
          )
          if (block.type === "list") return (
            <ul key={i} className="space-y-2">
              {block.items?.map((it, j) => (
                <li key={j} className="flex gap-3 text-[15px] text-white/60 leading-relaxed">
                  <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: ex.color }} />
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          )
          return null
        })}
      </article>

      {/* 相关科普 */}
      <div className="space-y-3 pt-4 border-t border-white/8">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/30">继续阅读</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {others.map(o => (
            <Link key={o.slug} href={`/learn/${o.slug}`}>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-all h-full">
                <span className="text-2xl">{o.icon}</span>
                <p className="text-sm font-medium text-white mt-2 leading-snug line-clamp-2">{o.title}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
