import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { eq, desc, sql, ilike, or } from "drizzle-orm"
import { db } from "../lib/db"
import { articles, articlePlayers } from "@rugby/db"

const createArticleSchema = z.object({
  title:     z.string().min(2).max(300),
  body:      z.string().min(10),
  episodeId: z.string().uuid().optional(),
  tags:      z.array(z.string()).default([]),
  playerIds: z.array(z.string().uuid()).default([]),
})

export default async function articleRoutes(app: FastifyInstance) {

  // GET /articles — 列表
  app.get("/", async (req, reply) => {
    const { page = 1, limit = 20, q } = req.query as any

    const where = q ? or(ilike(articles.title, `%${q}%`)) : eq(articles.status, "published")

    const rows = await db.query.articles.findMany({
      where,
      orderBy: desc(articles.publishedAt),
      limit:   Number(limit),
      offset:  (Number(page) - 1) * Number(limit),
      with: {
        author:  { columns: { id: true, nickname: true, avatar: true, role: true } },
        episode: { columns: { id: true, title: true, subtitle: true } },
        articlePlayers: { with: { player: { columns: { id: true, name: true, position: true } } } },
      },
    })

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(articles)

    return reply.send({ success: true, data: rows, meta: { page: Number(page), total: Number(count) } })
  })

  // GET /articles/:id
  app.get("/:id", async (req, reply) => {
    const { id } = req.params as { id: string }
    const article = await db.query.articles.findFirst({
      where: eq(articles.id, id),
      with: {
        author:  { columns: { id: true, nickname: true, avatar: true, role: true, isVerified: true } },
        episode: { columns: { id: true, title: true, subtitle: true, duration: true } },
        articlePlayers: { with: { player: true } },
      },
    })
    if (!article) return reply.status(404).send({ success: false, error: "文章不存在" })

    // 阅读量 +1
    await db.update(articles).set({ viewCount: sql`${articles.viewCount} + 1` }).where(eq(articles.id, id))

    return reply.send({ success: true, data: article })
  })

  // POST /articles — 发布文章（需要 editor/admin）
  app.post("/", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    if (!["editor", "admin", "host"].includes(req.user.role)) {
      return reply.status(403).send({ success: false, error: "需要编辑权限" })
    }

    const body = createArticleSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ success: false, error: body.error.errors[0].message })

    const { playerIds, ...articleData } = body.data

    const readTime = Math.ceil(articleData.body.split(/\s+/).length / 200) // 200字/分钟

    const [article] = await db.insert(articles).values({
      ...articleData,
      authorId:    req.user.userId,
      readTime,
      status:      "published",
      publishedAt: new Date(),
    }).returning()

    if (playerIds.length) {
      await db.insert(articlePlayers).values(playerIds.map(pid => ({ articleId: article.id, playerId: pid })))
    }

    return reply.status(201).send({ success: true, data: article })
  })

  // PATCH /articles/:id
  app.patch("/:id", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id } = req.params as { id: string }
    const article = await db.query.articles.findFirst({ where: eq(articles.id, id) })
    if (!article) return reply.status(404).send({ success: false, error: "文章不存在" })
    if (article.authorId !== req.user.userId && req.user.role !== "admin") {
      return reply.status(403).send({ success: false, error: "无权限修改" })
    }

    const [updated] = await db.update(articles)
      .set({ ...(req.body as any), updatedAt: new Date() })
      .where(eq(articles.id, id)).returning()

    return reply.send({ success: true, data: updated })
  })

  // DELETE /articles/:id
  app.delete("/:id", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id } = req.params as { id: string }
    await db.update(articles).set({ status: "archived" }).where(eq(articles.id, id))
    return reply.send({ success: true })
  })
}
