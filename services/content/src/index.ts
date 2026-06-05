import Fastify from "fastify"
import cors from "@fastify/cors"
import helmet from "@fastify/helmet"
import rateLimit from "@fastify/rate-limit"
import jwtPlugin from "./plugins/jwt"
import authRoutes from "./routes/auth"
import qaRoutes from "./routes/qa"
import episodeRoutes from "./routes/episodes"
import playerRoutes  from "./routes/players"
import articleRoutes from "./routes/articles"
import commentRoutes from "./routes/comments"
import meRoutes from "./routes/me"
import nflRoutes from "./routes/nfl"

const isProd = process.env.NODE_ENV === "production"

// 启动前校验必需的环境变量
function assertEnv() {
  const required = ["DATABASE_URL", "JWT_SECRET"]
  const missing = required.filter(k => !process.env[k])
  if (missing.length) {
    console.error(`❌ 缺少环境变量: ${missing.join(", ")}`)
    process.exit(1)
  }
  // 生产环境禁止使用默认弱密钥
  if (isProd && /dev|secret|change/i.test(process.env.JWT_SECRET ?? "")) {
    console.error("❌ 生产环境 JWT_SECRET 不能使用默认弱密钥")
    process.exit(1)
  }
}
assertEnv()

const app = Fastify({
  logger: isProd
    ? { level: "info" }
    : { level: "info", transport: { target: "pino-pretty" } },
  trustProxy: true,           // 部署在反向代理后取真实 IP
  bodyLimit: 1_048_576,       // 1MB 请求体上限
})

// ── 安全中间件 ─────────────────────────────────────────────
app.register(helmet, { contentSecurityPolicy: false }) // 安全响应头

// CORS：生产只允许白名单域名
const allowedOrigins = (process.env.CORS_ORIGINS ?? "").split(",").filter(Boolean)
app.register(cors, {
  origin: isProd ? (allowedOrigins.length ? allowedOrigins : false) : true,
  credentials: true,
})

// 全局限流：每 IP 每分钟 120 次
app.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: "1 minute",
})

app.register(jwtPlugin)

// ── 全局错误兜底 ───────────────────────────────────────────
app.setErrorHandler((err, req, reply) => {
  const status = err.statusCode ?? 500
  // 限流 429：直接返回友好提示，不当服务器错误
  if (status === 429) {
    return reply.status(429).send({ success: false, error: "请求过于频繁，请稍后再试" })
  }
  if (status >= 500) req.log.error(err)
  // 生产环境不泄露内部错误细节
  const message = status >= 500 && isProd ? "服务器内部错误" : err.message
  reply.status(status).send({ success: false, error: message })
})

app.setNotFoundHandler((req, reply) => {
  reply.status(404).send({ success: false, error: "接口不存在" })
})

// ── Routes ────────────────────────────────────────────────
app.register(authRoutes,    { prefix: "/auth" })
app.register(qaRoutes,      { prefix: "/qa" })
app.register(episodeRoutes, { prefix: "/episodes" })
app.register(playerRoutes,  { prefix: "/players" })
app.register(articleRoutes, { prefix: "/articles" })
app.register(commentRoutes, { prefix: "/comments" })
app.register(meRoutes,      { prefix: "/me" })
app.register(nflRoutes,     { prefix: "/nfl" })

app.get("/health", async () => ({ status: "ok", service: "content" }))

// ── Start ─────────────────────────────────────────────────
const start = async () => {
  try {
    const port = Number(process.env.PORT ?? 3001)
    await app.listen({ port, host: "0.0.0.0" })
    console.log(`Content service running on http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
