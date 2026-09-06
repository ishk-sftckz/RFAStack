import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  await pool.query(
    'TRUNCATE auth_user, auth_account, auth_session, auth_verification, membership, product, customer_order CASCADE',
  )
} finally {
  await pool.end()
}

await import('./seed')
