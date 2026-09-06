import { toNextJsHandler } from 'better-auth/next-js'
import { auth } from '@/features/identity/server/auth'

export const { GET, POST } = toNextJsHandler(auth)
