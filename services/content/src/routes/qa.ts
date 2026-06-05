import type { FastifyInstance } from "fastify"
import { z } from "zod"
import { eq, desc, sql, and } from "drizzle-orm"
import { db } from "../lib/db"
import { questions, answers, answerVotes, dailyAnswers, dailyQuiz } from "@rugby/db"

// ── Schemas ──────────────────────────────────────────────
const createQuestionSchema = z.object({
  title:            z.string().min(5).max(200),
  body:             z.string().min(10),
  tags:             z.array(z.string()).default([]),
  episodeId:        z.string().uuid().optional(),
  chapterTimestamp: z.number().int().optional(),
})

const createAnswerSchema = z.object({
  body: z.string().min(5),
})

// ── Routes ───────────────────────────────────────────────
export default async function qaRoutes(app: FastifyInstance) {

  // GET /qa/questions — 问题列表（分页）
  app.get("/questions", async (req, reply) => {
    const { page = 1, limit = 20, tag } = req.query as any

    const rows = await db.query.questions.findMany({
      orderBy: desc(questions.createdAt),
      limit:   Number(limit),
      offset:  (Number(page) - 1) * Number(limit),
      with: {
        author:  { columns: { id: true, nickname: true, avatar: true, isVerified: true, role: true } },
        answers: { columns: { id: true, isCertified: true } },
      },
    })

    const total = await db.select({ count: sql<number>`count(*)` }).from(questions)

    return reply.send({
      success: true,
      data: rows.map(q => ({
        ...q,
        answerCount:    q.answers.length,
        hasCertified:   q.answers.some(a => a.isCertified),
        answers: undefined,
      })),
      meta: { page: Number(page), total: Number(total[0].count) },
    })
  })

  // GET /qa/daily — 今日一题（不返回正确答案）
  app.get("/daily", async (req, reply) => {
    const today = new Date().toISOString().slice(0, 10)

    // 优先取今天排期的题，没有就取任意一题
    let quiz = await db.query.dailyQuiz.findFirst({
      where: eq(dailyQuiz.activeDate, today),
    })
    if (!quiz) {
      quiz = await db.query.dailyQuiz.findFirst()
    }
    if (!quiz) return reply.send({ success: true, data: null })

    // 统计作答分布
    const allAnswers = await db.query.dailyAnswers.findMany({
      where: eq(dailyAnswers.questionId, quiz.id),
    })
    const distribution = quiz.options.map((_, i) =>
      allAnswers.filter(a => a.choice === String(i)).length
    )

    // 当前用户是否已答
    let myAnswer: { choice: number; isCorrect: boolean } | null = null
    try {
      await req.jwtVerify()
      const rec = allAnswers.find(a => a.userId === req.user.userId)
      if (rec) myAnswer = { choice: Number(rec.choice), isCorrect: rec.isCorrect ?? false }
    } catch {}

    return reply.send({
      success: true,
      data: {
        id:         quiz.id,
        question:   quiz.question,
        options:    quiz.options,
        tags:       quiz.tags,
        difficulty: quiz.difficulty,
        totalAnswers: allAnswers.length,
        distribution,
        myAnswer,
        // 已答用户才返回答案
        ...(myAnswer ? { correctIdx: quiz.correctIdx, explanation: quiz.explanation } : {}),
      },
    })
  })

  // POST /qa/daily/:id/submit — 提交答案，返回对错 + 解析
  app.post("/daily/:id/submit", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id }       = req.params as { id: string }
    const { choice }   = req.body as { choice: number }

    const quiz = await db.query.dailyQuiz.findFirst({ where: eq(dailyQuiz.id, id) })
    if (!quiz) return reply.status(404).send({ success: false, error: "题目不存在" })

    // 防重复
    const existing = await db.query.dailyAnswers.findFirst({
      where: and(eq(dailyAnswers.questionId, id), eq(dailyAnswers.userId, req.user.userId)),
    })
    if (existing) {
      return reply.status(409).send({
        success: false,
        error: "你已作答",
        data: { correctIdx: quiz.correctIdx, explanation: quiz.explanation, myChoice: Number(existing.choice) },
      })
    }

    const isCorrect = choice === quiz.correctIdx
    await db.insert(dailyAnswers).values({
      questionId: id,
      userId:     req.user.userId,
      choice:     String(choice),
      isCorrect,
    })

    return reply.send({
      success: true,
      data: {
        isCorrect,
        correctIdx:  quiz.correctIdx,
        explanation: quiz.explanation,
      },
    })
  })

  // GET /qa/questions/:id — 问题详情 + 回答
  app.get("/questions/:id", async (req, reply) => {
    const { id } = req.params as { id: string }

    const question = await db.query.questions.findFirst({
      where: eq(questions.id, id),
      with: {
        author:  { columns: { id: true, nickname: true, avatar: true, isVerified: true, role: true } },
        answers: {
          orderBy: [desc(answers.isCertified), desc(answers.voteCount)],
          with: {
            author: { columns: { id: true, nickname: true, avatar: true, isVerified: true, role: true } },
          },
        },
      },
    })

    if (!question) return reply.status(404).send({ success: false, error: "问题不存在" })

    // 浏览量 +1
    await db.update(questions)
      .set({ viewCount: sql`${questions.viewCount} + 1` })
      .where(eq(questions.id, id))

    return reply.send({ success: true, data: question })
  })

  // POST /qa/questions — 发起提问（需要登录）
  app.post("/questions", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const body = createQuestionSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ success: false, error: body.error.errors[0].message })
    }

    const [question] = await db.insert(questions).values({
      ...body.data,
      authorId: req.user.userId,
    }).returning()

    return reply.status(201).send({ success: true, data: question })
  })

  // POST /qa/questions/:id/answers — 回答问题（需要登录）
  app.post("/questions/:id/answers", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id } = req.params as { id: string }
    const body = createAnswerSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ success: false, error: "回答内容太短" })
    }

    // 确认问题存在
    const question = await db.query.questions.findFirst({ where: eq(questions.id, id) })
    if (!question) return reply.status(404).send({ success: false, error: "问题不存在" })

    // 认证裁判/教练的回答自动标记
    const isCertified = ["referee"].includes(req.user.role)

    const [answer] = await db.insert(answers).values({
      questionId:  id,
      authorId:    req.user.userId,
      body:        body.data.body,
      isCertified,
    }).returning()

    // 如有认证回答，更新问题状态
    if (isCertified) {
      await db.update(questions)
        .set({ status: "answered" })
        .where(eq(questions.id, id))
    }

    return reply.status(201).send({ success: true, data: answer })
  })

  // POST /qa/answers/:id/vote — 给回答投票（需要登录）
  app.post("/answers/:id/vote", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const { id } = req.params as { id: string }

    // 检查是否已投过
    const existing = await db.query.answerVotes.findFirst({
      where: and(
        eq(answerVotes.answerId, id),
        eq(answerVotes.userId, req.user.userId)
      ),
    })

    if (existing) {
      // 已投过 → 取消投票
      await db.delete(answerVotes).where(
        and(eq(answerVotes.answerId, id), eq(answerVotes.userId, req.user.userId))
      )
      await db.update(answers)
        .set({ voteCount: sql`${answers.voteCount} - 1` })
        .where(eq(answers.id, id))
      return reply.send({ success: true, data: { voted: false } })
    }

    // 新增投票
    await db.insert(answerVotes).values({ answerId: id, userId: req.user.userId })
    await db.update(answers)
      .set({ voteCount: sql`${answers.voteCount} + 1` })
      .where(eq(answers.id, id))

    return reply.send({ success: true, data: { voted: true } })
  })

}
