import type { FastifyInstance } from "fastify"
import { eq, and, desc, sql } from "drizzle-orm"
import { db } from "../lib/db"
import { bookmarks, comments, dailyAnswers, listenProgress, questions, episodes, answers } from "@rugby/db"

export default async function meRoutes(app: FastifyInstance) {

  // ── 收藏 ─────────────────────────────────────────────────
  // POST /me/bookmarks  { targetType, targetId }
  app.post("/bookmarks", async (req, reply) => {
    await req.authenticate(reply); if (reply.sent) return
    const { targetType, targetId } = req.body as any
    if (!targetType || !targetId) return reply.status(400).send({ success: false, error: "参数缺失" })

    const existing = await db.query.bookmarks.findFirst({
      where: and(eq(bookmarks.userId, req.user.userId), eq(bookmarks.targetType, targetType), eq(bookmarks.targetId, targetId)),
    })
    if (existing) {
      await db.delete(bookmarks).where(eq(bookmarks.id, existing.id))
      return reply.send({ success: true, data: { bookmarked: false } })
    }
    await db.insert(bookmarks).values({ userId: req.user.userId, targetType, targetId })
    return reply.send({ success: true, data: { bookmarked: true } })
  })

  // GET /me/bookmarks — 我的收藏（按类型）
  app.get("/bookmarks", async (req, reply) => {
    await req.authenticate(reply); if (reply.sent) return
    const rows = await db.query.bookmarks.findMany({
      where: eq(bookmarks.userId, req.user.userId),
      orderBy: desc(bookmarks.createdAt),
    })
    return reply.send({ success: true, data: rows })
  })

  // ── 我的评论 ─────────────────────────────────────────────
  app.get("/comments", async (req, reply) => {
    await req.authenticate(reply); if (reply.sent) return
    const rows = await db.query.comments.findMany({
      where: eq(comments.authorId, req.user.userId),
      orderBy: desc(comments.createdAt),
      limit: 50,
    })
    return reply.send({ success: true, data: rows })
  })

  // ── 我的提问 ─────────────────────────────────────────────
  app.get("/questions", async (req, reply) => {
    await req.authenticate(reply); if (reply.sent) return
    const rows = await db.query.questions.findMany({
      where: eq(questions.authorId, req.user.userId),
      orderBy: desc(questions.createdAt),
      with: { answers: { columns: { id: true } } },
    })
    return reply.send({ success: true, data: rows.map(q => ({ ...q, answerCount: q.answers.length, answers: undefined })) })
  })

  // ── 我的回答 ─────────────────────────────────────────────
  app.get("/answers", async (req, reply) => {
    await req.authenticate(reply); if (reply.sent) return
    const rows = await db.query.answers.findMany({
      where: eq(answers.authorId, req.user.userId),
      orderBy: desc(answers.createdAt),
      with: { question: { columns: { id: true, title: true } } },
      limit: 50,
    })
    return reply.send({ success: true, data: rows })
  })

  // ── 答题历史 + 正确率 ────────────────────────────────────
  app.get("/quiz-stats", async (req, reply) => {
    await req.authenticate(reply); if (reply.sent) return
    const rows = await db.query.dailyAnswers.findMany({
      where: eq(dailyAnswers.userId, req.user.userId),
    })
    const total   = rows.length
    const correct = rows.filter(r => r.isCorrect).length
    return reply.send({
      success: true,
      data: { total, correct, accuracy: total ? Math.round(correct / total * 100) : 0 },
    })
  })

  // ── 断点续播 ─────────────────────────────────────────────
  // PUT /me/progress  { episodeId, position }  保存进度
  app.put("/progress", async (req, reply) => {
    await req.authenticate(reply); if (reply.sent) return
    const { episodeId, position } = req.body as { episodeId: string; position: number }
    if (!episodeId || position == null) return reply.status(400).send({ success: false, error: "参数缺失" })

    const existing = await db.query.listenProgress.findFirst({
      where: and(eq(listenProgress.userId, req.user.userId), eq(listenProgress.episodeId, episodeId)),
    })
    if (existing) {
      await db.update(listenProgress)
        .set({ position: Math.round(position), updatedAt: new Date() })
        .where(eq(listenProgress.id, existing.id))
    } else {
      await db.insert(listenProgress).values({ userId: req.user.userId, episodeId, position: Math.round(position) })
    }
    return reply.send({ success: true })
  })

  // GET /me/progress/:episodeId — 取某集进度
  app.get("/progress/:episodeId", async (req, reply) => {
    await req.authenticate(reply); if (reply.sent) return
    const { episodeId } = req.params as { episodeId: string }
    const row = await db.query.listenProgress.findFirst({
      where: and(eq(listenProgress.userId, req.user.userId), eq(listenProgress.episodeId, episodeId)),
    })
    return reply.send({ success: true, data: row ? { position: row.position } : null })
  })

  // GET /me/continue — 最近在听的（继续收听列表）
  app.get("/continue", async (req, reply) => {
    await req.authenticate(reply); if (reply.sent) return
    const rows = await db.query.listenProgress.findMany({
      where: eq(listenProgress.userId, req.user.userId),
      orderBy: desc(listenProgress.updatedAt),
      limit: 10,
      with: { episode: { columns: { id: true, title: true, subtitle: true, coverUrl: true, duration: true } } },
    })
    return reply.send({ success: true, data: rows.filter(r => r.episode) })
  })
}
