import 'server-only'
import { appendFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function traceRead(name: string, scope = 'public') {
  if (process.env.CACHE_TRACE !== '1') {
    return
  }

  const entry = JSON.stringify({ event: 'read', name, scope })
  console.info(entry)

  if (process.env.CACHE_TRACE_FILE) {
    mkdirSync(dirname(process.env.CACHE_TRACE_FILE), { recursive: true })
    appendFileSync(process.env.CACHE_TRACE_FILE, entry + '\n')
  }
}
