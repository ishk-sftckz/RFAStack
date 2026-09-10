# HTTP example boundaries

- Run workspace commands from this directory so Bun loads the root `.env` before Turborepo starts
  tasks.
- Keep API runtime imports inside `apps/api`; the web app may import only the API package's exported
  type.
- Put browser-safe shared schemas in `packages/contracts`; it must not import either application.
- Match Elysia and Next.js adapter response bodies. Next.js owns immediate server-cache invalidation
  after browser mutations.
- Keep signed carrier bodies unparsed until signature verification and Better Auth bodies unparsed
  until its handler runs.
- Preserve the backend outbox and the runtime and feature import checks when moving code.
