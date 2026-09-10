import { api } from '@/platform/http/client'
import { readResult } from '@/platform/http/result'
import { preferenceSchema, type PreferenceInput } from './model/membership.schema'

export async function updatePreferences(input: PreferenceInput) {
  return readResult(
    await api('/membership/preferences', { method: 'POST', body: preferenceSchema.parse(input) }),
  )
}
