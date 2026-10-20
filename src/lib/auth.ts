import '@fastify/jwt'
import type { FastifyReply, FastifyRequest } from 'fastify'

// Diz ao TypeScript o formato do que guardamos dentro do token.
// "sub" (subject) é o nome padrão do JWT para "de quem é este token".
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string }
    user: { sub: string }
  }
}

// preHandler: roda antes do handler da rota. Se o token for inválido,
// responde 401 e o handler nem chega a executar.
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch {
    return reply.status(401).send({ message: 'Não autenticado' })
  }
}
