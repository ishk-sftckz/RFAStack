import 'server-only'
import { revalidateTag } from 'next/cache'
import { procedure } from '@/platform/rpc/procedure'
import { preferenceSchema } from './model/membership.schema'
import { savePreferences } from './preferences.use-case'

export const membershipRouter = {
  preferences: procedure.input(preferenceSchema).handler(async ({ input, context }) => {
    const membership = await savePreferences(input, context.headers)
    revalidateTag(`preferences:${membership.userId}`, { expire: 0 })

    return { saved: true }
  }),
}
