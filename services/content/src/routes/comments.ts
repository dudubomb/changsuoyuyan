import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { eq, and, desc, sql, isNull } from "drizzle-orm"
import { db } from "../lib/db"
import { comments, commentLikes } from "@rugby/db"

const createSchema = z.object({
  targetType: z.enum(["episode", "article", "question"]),
  targetId:   z.string().uuid(),
  body:       z.string().min(1).max(2000),
  parentId:   z.string().uuid().optional(),
})

export default async function commentRoutes(app: FastifyInstance) {

  // GET /comments?targetType=episode&targetId=xxx — 某对象的评论（含回复）
  app.get("/", async (req, reply) => {
    const { targetType, targetId } = req.query as any
    if (!targetType || !targetId) {
      return reply.status(400).send({ success: false, error: "缺少 targetType / targetId" })
    }

    // 顶级评论
    const top = await db.query.comments.findMany({
      where: and(
        eq(comments.targetType, targetType),
        eq(comments.targetId, targetId),
        isNull(comments.parentId),
      ),
      orderBy: desc(comments.createdAt),
      with: {
        author: { columns: { id: true, nickname: true, avatar: true, role: true, isVerified: true } },
        likes:  { columns: { userId: true } },
      },
    })

    // 所有回复
    const replies = await db.query.comments.findMany({
      where: and(
        eq(comments.targetType, targetType),
        eq(comments.targetId, targetId),
        sql`${comments.parentId} IS NOT NULL`,
      ),
      orderBy: comments.createdAt,
      with: {
        author: { columns: { id: true, nickname: true, avatar: true, role: true, isVerified: true } },
        likes:  { columns: { userId: true } },
      },
    })

    // 当前用户（可选，用于标记是否点过赞）
    let uid: string | null = null
    try { await req.jwtVerify(); uid = req.user.userId } catch {}

    const shape = (c: any) => ({
      id: c.id, body: c.body, author: c.author, createdAt: c.createdAt,
      likeCount: c.likes.length,
      liked: uid ? c.likes.some((l: any) => l.userId === uid) : false,
    })

    const data = top.map((t: any) => ({
      ...shape(t),
      replies: replies.filter((r: any) => r.parentId === t.id).map(shape),
    }))

    return reply.send({ success: true, data })
  })

  // POST /comments — 发评论/回复（需登录）
  app.post("/", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const body = createSchema.safeParse(req.body)
    if (!body.success) return reply.status(400).send({ success: false, error: body.error.errors[0].message })

    const [c] = await db.insert(comments).values({
      ...body.data,
      authorId: req.user.userId,
    }).returning()

    return reply.status(201).send({ success: true, data: c })
  })

  // POST /comments/:id/like — 点赞/取消（需登录）
  app.post("/:id/like", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id } = req.params as { id: string }
    const existing = await db.query.commentLikes.findFirst({
      where: and(eq(commentLikes.commentId, id), eq(commentLikes.userId, req.user.userId)),
    })

    if (existing) {
      await db.delete(commentLikes).where(and(eq(commentLikes.commentId, id), eq(commentLikes.userId, req.user.userId)))
      await db.update(comments).set({ likeCount: sql`${comments.likeCount} - 1` }).where(eq(comments.id, id))
      return reply.send({ success: true, data: { liked: false } })
    }
    await db.insert(commentLikes).values({ commentId: id, userId: req.user.userId })
    await db.update(comments).set({ likeCount: sql`${comments.likeCount} + 1` }).where(eq(comments.id, id))
    return reply.send({ success: true, data: { liked: true } })
  })

  // DELETE /comments/:id — 删除自己的评论
  app.delete("/:id", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id } = req.params as { id: string }
    const c = await db.query.comments.findFirst({ where: eq(comments.id, id) })
    if (!c) return reply.status(404).send({ success: false, error: "评论不存在" })
    if (c.authorId !== req.user.userId && req.user.role !== "admin") {
      return reply.status(403).send({ success: false, error: "无权删除" })
    }
    await db.delete(comments).where(eq(comments.id, id))
    return reply.send({ success: true })
  })
}
