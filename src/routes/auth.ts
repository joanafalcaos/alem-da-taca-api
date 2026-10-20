import bcrypt from 'bcryptjs'
import type { FastifyInstance } from 'fastify'
import type { User } from '../generated/prisma/client.js'
import { prisma } from '../lib/prisma.js'
import { authenticate } from '../lib/auth.js'

type RegisterBody = { name: string; email: string; password: string }
type LoginBody = { email: string; password: string }

// Nunca devolvemos o passwordHash para o cliente.
function toPublicUser(user: User) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt }
}

export async function authRoutes(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>(
    '/auth/register',
    {
      // O Fastify valida o body com este JSON Schema antes de chamar o handler.
      // Se algo estiver errado, ele mesmo responde 400.
      schema: {
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          additionalProperties: false,
          properties: {
            name: { type: 'string', minLength: 1 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
          },
        },
      },
    },
    async (request, reply) => {
      const name = request.body.name.trim()
      const email = request.body.email.trim().toLowerCase()

      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) {
        return reply.status(409).send({ message: 'Email já cadastrado' })
      }

      const passwordHash = await bcrypt.hash(request.body.password, 10)
      const user = await prisma.user.create({ data: { name, email, passwordHash } })

      const token = await reply.jwtSign({ sub: user.id })
      return reply.status(201).send({ token, user: toPublicUser(user) })
    },
  )

  app.post<{ Body: LoginBody }>(
    '/auth/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          additionalProperties: false,
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const email = request.body.email.trim().toLowerCase()
      const user = await prisma.user.findUnique({ where: { email } })

      // Mesma mensagem para "email não existe" e "senha errada":
      // assim ninguém descobre quais emails estão cadastrados.
      const passwordOk = user && (await bcrypt.compare(request.body.password, user.passwordHash))
      if (!user || !passwordOk) {
        return reply.status(401).send({ message: 'Email ou senha inválidos' })
      }

      const token = await reply.jwtSign({ sub: user.id })
      return { token, user: toPublicUser(user) }
    },
  )

  app.get('/auth/me', { preHandler: authenticate }, async (request, reply) => {
    const user = await prisma.user.findUnique({ where: { id: request.user.sub } })

    // Token válido, mas o usuário pode ter sido apagado depois que o token foi emitido.
    if (!user) {
      return reply.status(401).send({ message: 'Não autenticado' })
    }

    return { user: toPublicUser(user) }
  })
}
