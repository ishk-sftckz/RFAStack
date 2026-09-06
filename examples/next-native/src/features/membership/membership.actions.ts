'use server'

import { headers } from 'next/headers'
import { refresh, updateTag } from 'next/cache'
import { savePreferences } from './preferences.use-case'
import { failure } from '@/shared/utils/errors'

export async function preferencesAction(_previous: { message: string }, form: FormData) {
  try {
    const membership = await savePreferences(
      { preference: form.get('preference') },
      await headers(),
    )
    updateTag(`preferences:${membership.userId}`)
    refresh()

    return { message: 'Preferences saved.' }
  } catch (error) {
    return { message: failure(error).error }
  }
}
