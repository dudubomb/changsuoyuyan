import Link from "next/link"

const ARTICLE = {
  id: "1",
  title: "Mahomes' Best 4th Quarter Performances This Season",
  publishedAt: "Jun 1, 2025",
  author: "Sarah Chen",
  authorRole: "高级分析师",
  readTime: "6 min",
  tags: ["NFL", "Chiefs", "QB Analysis"],
  episodeId: "1",
  episodeTitle: "NFL Week 15 Recap",
  body: [
    { type: "p", text: "Patrick Mahomes has once again proven why he's the gold standard at quarterback, with a series of clutch performances in the fourth quarter that have left defenses scrambling for answers." },
    { type: "h2", text: "The Numbers Don't Lie" },
    { type: "p", text: "Through 15 games this season, Mahomes has thrown for 1,247 yards in the fourth quarter alone — a figure that would rank among the top single-season totals for some quarterbacks. His passer rating in two-minute drill situations sits at a staggering 118.4." },
    { type: "playerCard", playerId: "1", playerName: "Patrick Mahomes", position: "QB", team: "Chiefs", rating: 9.4, stat: "38 TDs · 4,823 yards" },
    { type: "h2", text: "Against the Bills: A Masterclass" },
    { type: "p", text: "Sunday's overtime thriller showcased everything that makes Mahomes elite. Down 24-17 with 4:32 remaining, he orchestrated a 9-play, 75-yard drive that ended with a TD pass to Travis Kelce on 4th and 2." },
    { type: "p", text: "In overtime, facing a 3rd and 8, Mahomes extended the play for 4.2 seconds — an eternity in NFL terms — before finding Tyreek Hill on a crossing route for 19 yards. The Chiefs kicked the walk-off field goal three plays later." },
    { type: "h2", text: "What This Means for the Playoff Picture" },
    { type: "p", text: "With the Chiefs now holding the AFC's No. 1 seed, Mahomes' clutch performances have transformed what looked like a rebuilding year into a legitimate Super Bowl run." },
  ],
  relatedPlayers: [
    { id: "1", name: "Patrick Mahomes", position: "QB", team: "Chiefs", rating: 9.4 },
    { id: "5", name: "Travis Kelce", position: "TE", team: "Chiefs", rating: 9.1 },
  ],
}

export default function ArticlePage() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 w-full">
      <Link href="/" className="text-sm text-white/30 hover:text-white/60 transition-colors block mb-6">← 返回首页</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Article */}
        <article className="lg:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {ARTICLE.tags.map(t => (
                <span key={t} className="text-xs bg-blue-500/10 text-blue-300 border border-blue-400/20 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
            <h1 className="text-2xl font-bold text-white leading-snug">{ARTICLE.title}</h1>
            <div className="flex items-center gap-3 text-xs text-white/30">
              <div className="w-6 h-6 bg-white/10 border border-white/10 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {ARTICLE.author[0]}
              </div>
              <span className="text-white/50">{ARTICLE.author}</span>
              <span>·</span><span>{ARTICLE.authorRole}</span>
              <span>·</span><span>{ARTICLE.publishedAt}</span>
              <span>·</span><span>{ARTICLE.readTime} read</span>
            </div>
            <Link href={`/episodes/${ARTICLE.episodeId}`} className="inline-flex items-center gap-2 text-xs bg-blue-500/10 text-blue-300/70 border border-blue-400/20 px-3 py-1.5 rounded-full hover:bg-blue-500/15 transition-colors">
              🎙 配套播客：{ARTICLE.episodeTitle}
            </Link>
          </div>

          <div className="space-y-4">
            {ARTICLE.body.map((block, i) => {
              if (block.type === "p") return (
                <p key={i} className="text-white/55 leading-7 text-sm">{block.text}</p>
              )
              if (block.type === "h2") return (
                <h2 key={i} className="text-lg font-bold text-white mt-8 mb-2">{block.text}</h2>
              )
              if (block.type === "playerCard") return (
                <Link key={i} href={`/players/${block.playerId}`}>
                  <div className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-amber-400/25 rounded-xl p-4 flex items-center justify-between my-4 transition-all">
                    <div>
                      <p className="text-sm font-semibold text-white">{block.playerName}</p>
                      <p className="text-xs text-white/35">{block.position} · {block.team}</p>
                      <p className="text-xs text-amber-400/70 mt-1">{block.stat}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-amber-400">{block.rating}</p>
                      <p className="text-xs text-white/25">社区评分</p>
                    </div>
                  </div>
                </Link>
              )
              return null
            })}
          </div>
        </article>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">相关球员</p>
            {ARTICLE.relatedPlayers.map(p => (
              <Link key={p.id} href={`/players/${p.id}`}>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-amber-400/25 transition-all flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{p.name}</p>
                    <p className="text-xs text-white/35">{p.position} · {p.team}</p>
                  </div>
                  <p className="text-xl font-bold text-amber-400">{p.rating}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-white/30">配套播客</p>
            <Link href={`/episodes/${ARTICLE.episodeId}`}>
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:border-blue-400/25 transition-all">
                <div className="w-10 h-10 bg-blue-500/10 border border-blue-400/20 rounded-lg flex items-center justify-center text-lg mb-3">🎙</div>
                <p className="text-sm font-medium text-white">{ARTICLE.episodeTitle}</p>
                <button className="mt-3 text-xs bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/20 text-amber-300 px-3 py-1.5 rounded-lg transition-colors w-full">
                  ▶ 收听播客
                </button>
              </div>
            </Link>
          </div>
        </aside>
      </div>
    </main>
  )
}
