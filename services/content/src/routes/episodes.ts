import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { eq, desc, sql, ilike, or } from "drizzle-orm"
import { db } from "../lib/db"
import { episodes, episodePlayers, episodeTeams } from "@rugby/db"
import { parseFeed } from "../lib/rss"
import { transcribeFromUrl } from "../lib/transcribe"
import { searchShows, getShowEpisodes, getShow } from "../lib/spotify"

// ── Schemas ───────────────────────────────────────────────
const createEpisodeSchema = z.object({
  title:       z.string().min(2).max(300),
  subtitle:    z.string().optional(),
  audioUrl:    z.string().url(),
  coverUrl:    z.string().url().optional(),
  duration:    z.number().int().min(0),
  summary:     z.string().optional(),
  chapters:    z.array(z.object({
    title:           z.string(),
    startTime:       z.number(),
    linkedQuestionId: z.string().uuid().optional(),
  })).default([]),
  tags:        z.array(z.string()).default([]),
  playerIds:   z.array(z.string().uuid()).default([]),
  teamIds:     z.array(z.string().uuid()).default([]),
  publishedAt: z.string().datetime().optional(),
})

// ── Routes ────────────────────────────────────────────────
export default async function episodeRoutes(app: FastifyInstance) {

  // GET /episodes — 列表（分页 + 搜索）
  app.get("/", async (req, reply) => {
    const { page = 1, limit = 20, q } = req.query as any

    const where = q
      ? or(ilike(episodes.title, `%${q}%`), ilike(episodes.summary!, `%${q}%`))
      : eq(episodes.status, "published")

    const rows = await db.query.episodes.findMany({
      where,
      orderBy: desc(episodes.publishedAt),
      limit:   Number(limit),
      offset:  (Number(page) - 1) * Number(limit),
      with: {
        author: { columns: { id: true, nickname: true, avatar: true } },
        episodePlayers: { with: { player: { columns: { id: true, name: true, position: true } } } },
      },
    })

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(episodes)

    return reply.send({ success: true, data: rows, meta: { page: Number(page), total: Number(count) } })
  })

  // GET /episodes/:id — 单集详情
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    const episode = await db.query.episodes.findFirst({
      where: eq(episodes.id, id),
      with: {
        author:         { columns: { id: true, nickname: true, avatar: true } },
        episodePlayers: { with: { player: true } },
        episodeTeams:   { with: { team: true } },
      },
    })
    if (!episode) return reply.status(404).send({ success: false, error: "播客不存在" })

    // 播放量 +1
    await db.update(episodes)
      .set({ playCount: sql`${episodes.playCount} + 1` })
      .where(eq(episodes.id, id))

    return reply.send({ success: true, data: episode })
  })

  // POST /episodes — 手动创建单集（需要 host/editor/admin）
  app.post("/", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    if (!["host", "editor", "admin"].includes(req.user.role)) {
      return reply.status(403).send({ success: false, error: "权限不足" })
    }

    const body = createEpisodeSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ success: false, error: body.error.errors[0].message })
    }

    const { playerIds, teamIds, ...episodeData } = body.data
    const [episode] = await db.insert(episodes).values({
      ...episodeData,
      authorId:    req.user.userId,
      status:      "published",
      publishedAt: episodeData.publishedAt ? new Date(episodeData.publishedAt) : new Date(),
    }).returning()

    // 关联球员
    if (playerIds.length) {
      await db.insert(episodePlayers).values(playerIds.map(pid => ({ episodeId: episode.id, playerId: pid })))
    }
    // 关联球队
    if (teamIds.length) {
      await db.insert(episodeTeams).values(teamIds.map(tid => ({ episodeId: episode.id, teamId: tid })))
    }

    return reply.status(201).send({ success: true, data: episode })
  })

  // PATCH /episodes/:id — 更新单集
  app.patch("/:id", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id } = req.params as { id: string }
    const episode = await db.query.episodes.findFirst({ where: eq(episodes.id, id) })
    if (!episode) return reply.status(404).send({ success: false, error: "播客不存在" })
    if (episode.authorId !== req.user.userId && req.user.role !== "admin") {
      return reply.status(403).send({ success: false, error: "无权限修改" })
    }

    const [updated] = await db.update(episodes)
      .set({ ...(req.body as any), updatedAt: new Date() })
      .where(eq(episodes.id, id))
      .returning()

    return reply.send({ success: true, data: updated })
  })

  // DELETE /episodes/:id
  app.delete("/:id", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id } = req.params as { id: string }
    const episode = await db.query.episodes.findFirst({ where: eq(episodes.id, id) })
    if (!episode) return reply.status(404).send({ success: false, error: "播客不存在" })
    if (episode.authorId !== req.user.userId && req.user.role !== "admin") {
      return reply.status(403).send({ success: false, error: "无权限删除" })
    }

    await db.update(episodes).set({ status: "archived" }).where(eq(episodes.id, id))
    return reply.send({ success: true })
  })

  // ── 导入相关 ─────────────────────────────────────────────

  // POST /episodes/:id/transcribe — 转录字幕
  app.post("/:id/transcribe", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id } = req.params as { id: string }
    const episode = await db.query.episodes.findFirst({ where: eq(episodes.id, id) })
    if (!episode) return reply.status(404).send({ success: false, error: "播客不存在" })
    if (episode.transcribedAt) {
      return reply.send({ success: true, data: { cached: true, vttContent: episode.vttContent } })
    }

    try {
      reply.raw.setHeader("Content-Type", "text/event-stream")
      reply.raw.setHeader("Cache-Control", "no-cache")
      reply.raw.write(`data: ${JSON.stringify({ status: "downloading" })}\n\n`)

      const vttContent = await transcribeFromUrl(episode.audioUrl)

      await db.update(episodes)
        .set({ vttContent, transcribedAt: new Date() })
        .where(eq(episodes.id, id))

      reply.raw.write(`data: ${JSON.stringify({ status: "done", vttContent })}\n\n`)
      reply.raw.end()
    } catch (err: any) {
      reply.raw.write(`data: ${JSON.stringify({ status: "error", error: err.message })}\n\n`)
      reply.raw.end()
    }
  })

  // GET /episodes/:id/vtt — 获取已有字幕
  app.get("/:id/vtt", async (req, reply) => {
    const { id } = req.params as { id: string }
    const episode = await db.query.episodes.findFirst({
      where:   eq(episodes.id, id),
      columns: { vttContent: true, transcribedAt: true },
    })
    if (!episode?.vttContent) {
      return reply.status(404).send({ success: false, error: "暂无字幕" })
    }
    return reply.send({ success: true, data: { vttContent: episode.vttContent, transcribedAt: episode.transcribedAt } })
  })

  // POST /episodes/import/rss — 从 RSS 导入（小宇宙/任意平台）
  app.post("/import/rss", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    if (!["host", "editor", "admin"].includes(req.user.role)) {
      return reply.status(403).send({ success: false, error: "权限不足" })
    }

    const { url, limit = 10 } = req.body as { url: string; limit?: number }
    if (!url) return reply.status(400).send({ success: false, error: "请提供 RSS URL" })

    try {
      const feed = await parseFeed(url)

      // 只取最新 N 集
      const toImport = feed.episodes.slice(0, Math.min(limit, 50))

      const inserted = await Promise.all(
        toImport.map(ep =>
          db.insert(episodes).values({
            authorId:    req.user.userId,
            title:       ep.title,
            subtitle:    feed.title,
            audioUrl:    ep.audioUrl,
            coverUrl:    ep.coverUrl || feed.coverUrl,
            duration:    ep.duration,
            summary:     ep.description,
            tags:        [],
            chapters:    [],
            status:      "published",
            publishedAt: ep.publishedAt,
          })
          .onConflictDoNothing()   // 防止重复导入
          .returning()
        )
      )

      return reply.send({
        success: true,
        data: {
          feedTitle:  feed.title,
          feedAuthor: feed.author,
          imported:   inserted.filter(r => r.length > 0).length,
          total:      toImport.length,
        },
      })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: `RSS 解析失败: ${err.message}` })
    }
  })

  // POST /episodes/import/rss/preview — 预览 RSS 内容（不写入数据库）
  app.post("/import/rss/preview", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { url } = req.body as { url: string }
    if (!url) return reply.status(400).send({ success: false, error: "请提供 RSS URL" })

    try {
      const feed = await parseFeed(url)
      return reply.send({ success: true, data: feed })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: `RSS 解析失败: ${err.message}` })
    }
  })

  // GET /episodes/spotify/search?q=xxx — 搜索 Spotify 播客
  app.get("/spotify/search", async (req, reply) => {
    const { q } = req.query as { q?: string }
    if (!q) return reply.status(400).send({ success: false, error: "请输入搜索关键词" })

    try {
      const shows = await searchShows(q)
      return reply.send({ success: true, data: shows })
    } catch (err: any) {
      return reply.status(503).send({ success: false, error: "Spotify API 未配置或不可用" })
    }
  })

  // POST /episodes/import/spotify — 从 Spotify Show 导入单集
  app.post("/import/spotify", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    if (!["host", "editor", "admin"].includes(req.user.role)) {
      return reply.status(403).send({ success: false, error: "权限不足" })
    }

    const { showId, limit = 10 } = req.body as { showId: string; limit?: number }
    if (!showId) return reply.status(400).send({ success: false, error: "请提供 Spotify Show ID" })

    try {
      const [show, spotifyEpisodes] = await Promise.all([
        getShow(showId),
        getShowEpisodes(showId, Math.min(limit, 50)),
      ])

      const toImport = spotifyEpisodes.filter(ep => ep.audio_preview_url)

      const inserted = await Promise.all(
        toImport.map(ep =>
          db.insert(episodes).values({
            authorId:    req.user.userId,
            title:       ep.name,
            subtitle:    show?.name ?? "",
            audioUrl:    ep.audio_preview_url!,
            coverUrl:    ep.images?.[0]?.url ?? show?.images?.[0]?.url ?? "",
            duration:    Math.round(ep.duration_ms / 1000),
            summary:     ep.description,
            tags:        [],
            chapters:    [],
            status:      "published",
            publishedAt: new Date(ep.release_date),
          })
          .onConflictDoNothing()
          .returning()
        )
      )

      return reply.send({
        success: true,
        data: {
          showName: show?.name ?? showId,
          imported: inserted.filter(r => r.length > 0).length,
          total:    toImport.length,
          note:     "Spotify 免费 API 只提供 30s 预览片段，完整音频需要 Premium 授权",
        },
      })
    } catch (err: any) {
      return reply.status(400).send({ success: false, error: err.message })
    }
  })
}
