import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { prisma } from '../src/lib/prisma.js'

// Senha conhecida só para desenvolvimento — nunca usar em produção.
const DEV_PASSWORD = 'senha123'

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10)

  // upsert = "atualiza se existir, cria se não existir".
  // Busca pelo email (campo único), então rodar o seed várias vezes não duplica o usuário.
  const user = await prisma.user.upsert({
    where: { email: 'joana@example.com' },
    update: {},
    create: {
      name: 'Joana Falcão',
      email: 'joana@example.com',
      passwordHash,
    },
  })

  console.log(`Usuário de seed: ${user.email} (senha: ${DEV_PASSWORD})`)
}

main()
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
