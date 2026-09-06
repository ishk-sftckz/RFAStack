import 'server-only'
import { revalidateTag } from 'next/cache'
import { procedure } from '@/platform/rpc/procedure'
import { preferenceSchema } from '../model/identity.schema'
import { savePreferences } from './preferences.use-case'

export const identityRouter = {
  preferences: procedure.input(preferenceSchema).handler(async ({ input, context }) => {
    const identity = await savePreferences(input, context.headers)
    revalidateTag(`preferences:${identity.userId}`, { expire: 0 })

    return { saved: true }
  }),
}
