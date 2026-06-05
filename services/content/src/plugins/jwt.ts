import fp from "fastify-plugin"
import fastifyJwt from "@fastify/jwt"
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify"

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { userId: string; role: string }
    user:    { userId: string; role: string }
  }
}

export default fp(async (app: FastifyInstance) => {
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET ?? "dev_jwt_secret",
  })

  // 装饰：需要登录时调 request.authenticate()
  app.decorateRequest("authenticate", async function (this: FastifyRequest, reply: FastifyReply) {
    try {
      await this.jwtVerify()
    } catch {
      reply.status(401).send({ success: false, error: "Unauthorized" })
    }
  })
})
