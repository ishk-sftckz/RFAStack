'use client'

import { useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { identityRpc } from '../identity.rpc-client'

export function Preferences({ preference }: { preference: string }) {
  const router = useRouter()
  const mutation = useMutation(
    identityRpc.preferences.mutationOptions({ onSuccess: () => router.refresh() }),
  )

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        mutation.mutate({
          preference: new FormData(event.currentTarget).get('preference') as 'standard' | 'express',
        })
      }}
    >
      <label>
        Delivery speed
        <select name="preference" defaultValue={preference}>
          <option value="standard">Standard</option>
          <option value="express">Express</option>
        </select>
      </label>
      <button disabled={mutation.isPending}>Save preferences</button>
      <p role="alert">{mutation.error?.message}</p>
      <p role="status">{mutation.isSuccess ? 'Preferences saved.' : ''}</p>
    </form>
  )
}
