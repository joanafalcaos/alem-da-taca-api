import type { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma.js'

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_request, reply) => {
    try {
      await prisma.$queryRaw`SELECT 1`
      return { status: 'ok' }
    } catch (err) {
      app.log.error(err, 'Falha ao conectar no banco')
      return reply.status(503).send({ status: 'erro', detail: 'banco indisponível' })
    }
  })
}
