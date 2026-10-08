import Fastify from 'fastify'
import { healthRoutes } from './routes/health.js'
import { prisma } from './lib/prisma.js'

export function buildApp() {
  const app = Fastify({
    logger: true,
  })

  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  app.register(healthRoutes)

  return app
}
