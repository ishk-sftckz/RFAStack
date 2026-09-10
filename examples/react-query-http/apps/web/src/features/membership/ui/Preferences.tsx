'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { updatePreferences } from '../membership.api'
import { preferenceSchema } from '../model/membership.schema'
import type { Membership } from '../model/membership.schema'

export function Preferences({ membership }: { membership: Membership }) {
  const router = useRouter()
  const preferences = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => router.refresh(),
  })

  return (
    <section>
      <h2>Workspace preferences</h2>
      <p className="hint">Set delivery speed and the filter used when you return.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          preferences.mutate(
            preferenceSchema.parse({
              preference: String(new FormData(e.currentTarget).get('preference')),
              savedFilter: String(new FormData(e.currentTarget).get('savedFilter')),
            }),
          )
        }}
      >
        <label>
          Delivery speed
          <select name="preference" defaultValue={membership.preference}>
            <option value="standard">Standard</option>
            <option value="express">Express</option>
          </select>
        </label>
        <label>
          Default queue status
          <select name="savedFilter" defaultValue={membership.savedFilter}>
            {['all', 'queued', 'packed', 'dispatched', 'delivered'].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <button disabled={preferences.isPending}>Save preferences</button>
      </form>
      <p role="alert">{preferences.error?.message}</p>
      <p role="status">{preferences.isSuccess ? 'Preferences saved.' : ''}</p>
    </section>
  )
}
