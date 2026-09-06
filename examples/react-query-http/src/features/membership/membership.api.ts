import { request } from '@/platform/http/client'
import type { PreferenceInput } from './model/membership.schema'

export async function updatePreferences(input: PreferenceInput) {
  await request('/api/membership/preferences', input)
}
