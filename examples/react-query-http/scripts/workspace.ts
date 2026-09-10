import { resolve } from 'node:path'

// Running a Bun entry point loads the root .env before the native Turbo process starts.
const child = Bun.spawn(
  [resolve(import.meta.dir, '../node_modules/.bin/turbo'), 'run', ...Bun.argv.slice(2)],
  {
    env: process.env,
    // Keep the test runner's process-group signal from reaching Turbo twice.
    detached: true,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  },
)

let stopping = false
function stop() {
  if (stopping) return
  stopping = true
  child.kill('SIGTERM')
}
process.once('SIGINT', stop)
process.once('SIGTERM', stop)
process.exit(await child.exited)
