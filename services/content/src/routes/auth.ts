import type { FastifyInstance } from "fastify"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { eq } from "drizzle-orm"
import { db } from "../lib/db"
import { users, refreshTokens } from "@rugby/db"
import crypto from "crypto"

// ── Schemas ──────────────────────────────────────────────
const registerSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8, "密码至少 8 位"),
  nickname: z.string().min(2).max(30),
})

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string(),
})

// ── Helpers ──────────────────────────────────────────────
function signTokens(app: FastifyInstance, userId: string, role: string) {
  const accessToken = app.jwt.sign(
    { userId, role },
    { expiresIn: "15m" }
  )
  const refreshToken = crypto.randomBytes(40).toString("hex")
  return { accessToken, refreshToken }
}

// ── Routes ───────────────────────────────────────────────
export default async function authRoutes(app: FastifyInstance) {

  // 认证接口严格限流：每 IP 每 15 分钟最多 10 次登录/注册尝试
  const authLimit = {
    config: {
      rateLimit: { max: 10, timeWindow: "15 minutes" },
    },
  }

  // POST /auth/register
  app.post("/register", authLimit, async (req, reply) => {
    const body = registerSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ success: false, error: body.error.errors[0].message })
    }
    const { email, password, nickname } = body.data

    // 检查邮箱是否已存在
    const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
    if (existing) {
      return reply.status(409).send({ success: false, error: "该邮箱已注册" })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const [user] = await db.insert(users).values({ email, passwordHash, nickname }).returning()

    const { accessToken, refreshToken } = signTokens(app, user.id, user.role)

    // 存 refresh token（30天过期）
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt })

    return reply.status(201).send({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, nickname: user.nickname, email: user.email, role: user.role },
      },
    })
  })

  // POST /auth/login
  app.post("/login", authLimit, async (req, reply) => {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) {
      return reply.status(400).send({ success: false, error: "请填写邮箱和密码" })
    }
    const { email, password } = body.data

    const user = await db.query.users.findFirst({ where: eq(users.email, email) })
    if (!user || !user.passwordHash) {
      return reply.status(401).send({ success: false, error: "邮箱或密码错误" })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.status(401).send({ success: false, error: "邮箱或密码错误" })
    }

    if (!user.isActive) {
      return reply.status(403).send({ success: false, error: "账号已被封禁" })
    }

    const { accessToken, refreshToken } = signTokens(app, user.id, user.role)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await db.insert(refreshTokens).values({ userId: user.id, token: refreshToken, expiresAt })

    return reply.send({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, nickname: user.nickname, email: user.email, role: user.role },
      },
    })
  })

  // POST /auth/refresh
  app.post("/refresh", async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (!refreshToken) {
      return reply.status(400).send({ success: false, error: "缺少 refreshToken" })
    }

    const stored = await db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.token, refreshToken),
      with: { user: true },
    })

    if (!stored || stored.expiresAt < new Date()) {
      return reply.status(401).send({ success: false, error: "Token 已过期，请重新登录" })
    }

    // 轮换 refresh token
    await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken))
    const { accessToken, refreshToken: newRefreshToken } = signTokens(app, stored.userId, stored.user.role)
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    await db.insert(refreshTokens).values({ userId: stored.userId, token: newRefreshToken, expiresAt })

    return reply.send({
      success: true,
      data: { accessToken, refreshToken: newRefreshToken },
    })
  })

  // POST /auth/logout
  app.post("/logout", async (req, reply) => {
    const { refreshToken } = req.body as { refreshToken?: string }
    if (refreshToken) {
      await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken))
    }
    return reply.send({ success: true })
  })

  // GET /auth/me  （需要登录）
  app.get("/me", async (req, reply) => {
    await req.authenticate(reply)
    if (reply.sent) return

    const user = await db.query.users.findFirst({
      where: eq(users.id, req.user.userId),
      columns: { passwordHash: false }, // 不返回密码
    })

    if (!user) return reply.status(404).send({ success: false, error: "用户不存在" })

    return reply.send({ success: true, data: user })
  })
}
