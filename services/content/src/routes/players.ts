import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { eq, desc, ilike, or, sql, and } from "drizzle-orm"
import { db } from "../lib/db"
import { players, playerStats, playerRatings, teams } from "@rugby/db"

export default async function playerRoutes(app: FastifyInstance) {

  // GET /players — 列表（分页 + 位置筛选 + 搜索）
  app.get("/", async (req, reply) => {
    const { page = 1, limit = 20, position, teamId, q } = req.query as any

    const conditions = []
    if (position && position !== "全部") conditions.push(eq(players.position, position))
    if (teamId)                          conditions.push(eq(players.teamId, teamId))
    if (q) conditions.push(or(ilike(players.name, `%${q}%`), ilike(players.bio!, `%${q}%`)))

    const rows = await db.query.players.findMany({
      where: conditions.length ? and(...conditions) : undefined,
      // 稳定排序：有照片优先，再按 id（保证分页不重复）
      orderBy: [desc(players.avatarUrl), players.id],
      limit:  Number(limit),
      offset: (Number(page) - 1) * Number(limit),
      with: {
        team:    { columns: { id: true, name: true, shortName: true, abbreviation: true, primaryColor: true } },
        stats:   { orderBy: desc(playerStats.season), limit: 1 },
        ratings: { columns: { score: true } },
      },
    })

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(players)
      .where(conditions.length ? and(...conditions) : undefined)

    const data = rows.map(p => ({
      ...p,
      communityRating: p.ratings.length
        ? Math.round(p.ratings.reduce((s, r) => s + r.score, 0) / p.ratings.length * 10) / 10
        : null,
      ratingCount: p.ratings.length,
      ratings: undefined,
    }))

    return reply.send({ success: true, data, meta: { page: Number(page), total: Number(count) } })
  })

  // GET /players/:id — 球员详情
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string }

    const player = await db.query.players.findFirst({
      where: eq(players.id, id),
      with: {
        team:    true,
        stats:   { orderBy: desc(playerStats.season) },
        ratings: {
          with: { user: { columns: { id: true, nickname: true, avatar: true } } },
          orderBy: desc(playerRatings.createdAt),
          limit: 10,
        },
      },
    })

    if (!player) return reply.status(404).send({ success: false, error: "球员不存在" })

    const communityRating = player.ratings.length
      ? Math.round(player.ratings.reduce((s, r) => s + r.score, 0) / player.ratings.length * 10) / 10
      : null

    return reply.send({ success: true, data: { ...player, communityRating, ratingCount: player.ratings.length } })
  })

  // GET /players/:id/related — 相关球员（同位置，优先有照片）
  app.get("/:id/related", async (req, reply) => {
    const { id } = req.params as { id: string }
    const player = await db.query.players.findFirst({ where: eq(players.id, id) })
    if (!player) return reply.send({ success: true, data: [] })

    // 同位置其他球员，有照片优先，随机取一批再截 3 个
    const candidates = await db.query.players.findMany({
      where: and(
        eq(players.position, player.position),
        sql`${players.id} != ${id}`,
      ),
      orderBy: [desc(players.avatarUrl), sql`random()`],
      limit: 12,
      with: {
        team: { columns: { id: true, shortName: true, abbreviation: true, primaryColor: true } },
        ratings: { columns: { score: true } },
      },
    })

    // 同队的排更前
    const sorted = candidates.sort((a, b) => {
      const aSame = a.teamId === player.teamId ? 1 : 0
      const bSame = b.teamId === player.teamId ? 1 : 0
      return bSame - aSame
    }).slice(0, 3)

    const data = sorted.map(p => ({
      id: p.id, name: p.name, position: p.position, jersey: p.jersey,
      avatarUrl: p.avatarUrl, team: p.team,
      communityRating: p.ratings.length
        ? Math.round(p.ratings.reduce((s, r) => s + r.score, 0) / p.ratings.length * 10) / 10
        : null,
    }))

    return reply.send({ success: true, data })
  })

  // POST /players/:id/rate — 提交评分（需要登录）
  app.post("/:id/rate", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id }    = req.params as { id: string }
    const { score, comment } = req.body as { score: number; comment?: string }

    if (!score || score < 0 || score > 10) {
      return reply.status(400).send({ success: false, error: "评分须在 0-10 之间" })
    }

    const player = await db.query.players.findFirst({ where: eq(players.id, id) })
    if (!player) return reply.status(404).send({ success: false, error: "球员不存在" })

    // upsert：已评过则更新
    const existing = await db.query.playerRatings.findFirst({
      where: and(eq(playerRatings.playerId, id), eq(playerRatings.userId, req.user.userId)),
    })

    if (existing) {
      await db.update(playerRatings)
        .set({ score, comment, updatedAt: new Date() })
        .where(and(eq(playerRatings.playerId, id), eq(playerRatings.userId, req.user.userId)))
    } else {
      await db.insert(playerRatings).values({ playerId: id, userId: req.user.userId, score, comment })
    }

    return reply.send({ success: true, data: { score } })
  })

  // GET /teams — 所有球队
  app.get("/teams/all", async (req, reply) => {
    const rows = await db.query.teams.findMany({ orderBy: teams.name })
    return reply.send({ success: true, data: rows })
  })
}
