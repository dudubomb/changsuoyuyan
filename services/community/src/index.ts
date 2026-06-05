import Fastify from 'fastify'
import cors from '@fastify/cors'

const app = Fastify({ logger: true })

app.register(cors, { origin: true })

app.get('/health', async () => ({ status: 'ok', service: 'community' }))

const start = async () => {
  try {
    await app.listen({ port: 3002, host: '0.0.0.0' })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
