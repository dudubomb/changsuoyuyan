import type { FastifyInstance } from "fastify"

// ESPN 公开 NFL 数据代理（带内存缓存，减少请求）
const ESPN  = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
const ESPN2 = "https://site.api.espn.com/apis/v2/sports/football/nfl"

type Cache = { data: any; expires: number }
const cache = new Map<string, Cache>()

async function cached(key: string, url: string, ttlMs: number) {
  const hit = cache.get(key)
  if (hit && Date.now() < hit.expires) return hit.data
  const res  = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } })
  const data = await res.json()
  cache.set(key, { data, expires: Date.now() + ttlMs })
  return data
}

export default async function nflRoutes(app: FastifyInstance) {

  // GET /nfl/scoreboard — 比分 + 赛程
  app.get("/scoreboard", async (req, reply) => {
    try {
      const d = await cached("scoreboard", `${ESPN}/scoreboard`, 60_000) // 1分钟缓存
      const games = (d.events ?? []).map((e: any) => {
        const comp = e.competitions?.[0]
        const home = comp?.competitors?.find((c: any) => c.homeAway === "home")
        const away = comp?.competitors?.find((c: any) => c.homeAway === "away")
        return {
          id:        e.id,
          name:      e.shortName,
          date:      e.date,
          status:    e.status?.type?.description,
          state:     e.status?.type?.state,   // pre | in | post
          detail:    e.status?.type?.shortDetail,
          home: home && {
            name: home.team?.shortDisplayName, abbr: home.team?.abbreviation,
            logo: home.team?.logo, score: home.score, color: home.team?.color,
            record: home.records?.[0]?.summary,
          },
          away: away && {
            name: away.team?.shortDisplayName, abbr: away.team?.abbreviation,
            logo: away.team?.logo, score: away.score, color: away.team?.color,
            record: away.records?.[0]?.summary,
          },
        }
      })
      return reply.send({ success: true, data: games, week: d.week?.number, season: d.season?.year })
    } catch {
      return reply.status(503).send({ success: false, error: "赛事数据暂不可用" })
    }
  })

  // GET /nfl/standings — 球队排名榜
  app.get("/standings", async (req, reply) => {
    try {
      const d = await cached("standings", `${ESPN2}/standings`, 600_000) // 10分钟
      const stat = (entry: any, name: string) =>
        entry.stats?.find((s: any) => s.name === name)?.displayValue ?? "-"

      const conferences = (d.children ?? []).map((conf: any) => ({
        name:  conf.abbreviation ?? conf.shortName,
        teams: (conf.standings?.entries ?? []).map((e: any) => ({
          name:   e.team?.shortDisplayName,
          abbr:   e.team?.abbreviation,
          logo:   e.team?.logos?.[0]?.href,
          color:  e.team?.color,
          wins:   stat(e, "wins"),
          losses: stat(e, "losses"),
          ties:   stat(e, "ties"),
          pct:    stat(e, "winPercent"),
          diff:   stat(e, "differential"),
          streak: stat(e, "streak"),
          seed:   stat(e, "playoffSeed"),
        })),
      }))
      return reply.send({ success: true, data: conferences })
    } catch {
      return reply.status(503).send({ success: false, error: "排名暂不可用" })
    }
  })

  // GET /nfl/game/:id — 单场详细数据
  app.get("/game/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    try {
      const d = await cached(`game-${id}`, `${ESPN}/summary?event=${id}`, 60_000)
      const comp = d.header?.competitions?.[0]
      const teams = (comp?.competitors ?? []).map((c: any) => ({
        homeAway: c.homeAway,
        name:  c.team?.displayName,
        abbr:  c.team?.abbreviation,
        logo:  c.team?.logos?.[0]?.href ?? c.team?.logo,
        color: c.team?.color,
        score: c.score,
        record: c.record?.[0]?.displayValue,
        // 线性比分（每节）
        linescores: c.linescores?.map((l: any) => l.displayValue) ?? [],
      }))

      // 球队对比数据
      const boxTeams = d.boxscore?.teams ?? []
      const teamStats = boxTeams.map((bt: any) => ({
        abbr:  bt.team?.abbreviation,
        stats: (bt.statistics ?? []).map((s: any) => ({ label: s.label, value: s.displayValue })),
      }))

      // 关键球员（leaders）
      const leaders = (d.leaders ?? []).slice(0, 3).map((cat: any) => ({
        category: cat.displayName ?? cat.name,
        leaders:  (cat.leaders ?? []).slice(0, 2).map((l: any) => ({
          name:        l.athlete?.shortName ?? l.athlete?.displayName,
          team:        l.team?.abbreviation,
          headshot:    l.athlete?.headshot,
          displayValue: l.displayValue,
        })),
      }))

      return reply.send({
        success: true,
        data: {
          status:   d.header?.competitions?.[0]?.status?.type?.description,
          detail:   d.header?.competitions?.[0]?.status?.type?.shortDetail,
          date:     comp?.date,
          teams,
          teamStats,
          leaders,
          venue:    d.gameInfo?.venue?.fullName,
        },
      })
    } catch {
      return reply.status(503).send({ success: false, error: "比赛数据暂不可用" })
    }
  })

  // GET /nfl/news — 热点新闻
  app.get("/news", async (req, reply) => {
    try {
      const d = await cached("news", `${ESPN}/news`, 300_000) // 5分钟缓存
      const news = (d.articles ?? []).slice(0, 8).map((a: any) => ({
        headline:    a.headline,
        description: a.description,
        published:   a.published,
        image:       a.images?.[0]?.url,
        link:        a.links?.web?.href,
        category:    a.categories?.[0]?.description,
      }))
      return reply.send({ success: true, data: news })
    } catch {
      return reply.status(503).send({ success: false, error: "新闻暂不可用" })
    }
  })
}
