import 'dotenv/config'
import { buildApp } from './app.js'

const app = buildApp()

const port = Number(process.env.PORT) || 3333

async function start() {
  try {
    const address = await app.listen({ port })
    app.log.info(`Servidor rodando em ${address}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

async function shutdown() {
  app.log.info('Encerrando servidor...')
  await app.close()
  process.exit(0)
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)

start()
