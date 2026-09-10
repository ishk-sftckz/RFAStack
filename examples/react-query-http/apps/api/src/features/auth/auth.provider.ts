import { createAuthProvider } from '../../platform/auth/server'
import { user, session, account, verification } from './auth.table'

export const authProvider = createAuthProvider({ user, session, account, verification })
