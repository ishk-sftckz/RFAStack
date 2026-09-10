import { app } from './app'
import { deliverInvalidations } from './features/fulfillment/deliver-invalidations.use-case'
import { pool } from './platform/database/client'

app.listen({ port: 4102, hostname: '127.0.0.1' })
const timer = setInterval(() => void deliverInvalidations(), 3000)

async function stop() {
  clearInterval(timer)
  await app.stop()
  await pool.end()
  process.exit(0)
}

process.once('SIGTERM', () => void stop())
process.once('SIGINT', () => void stop())
console.info('Fulfillment API on 4102')
