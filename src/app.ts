import Fastify from 'fastify'
import fastifyJwt from '@fastify/jwt'
import fastifyCors from '@fastify/cors'
import { healthRoutes } from './routes/health.js'
import { authRoutes } from './routes/auth.js'
import { prisma } from './lib/prisma.js'

export function buildApp() {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET não definido no .env')
  }

  const app = Fastify({
    logger: true,
  })

  // Permite que o front (outra porta = outra "origem") chame a API pelo navegador.
  app.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  })

  app.register(fastifyJwt, {
    secret: jwtSecret,
    sign: { expiresIn: '7d' },
  })

  app.addHook('onClose', async () => {
    await prisma.$disconnect()
  })

  app.register(healthRoutes)
  app.register(authRoutes)

  return app
}
