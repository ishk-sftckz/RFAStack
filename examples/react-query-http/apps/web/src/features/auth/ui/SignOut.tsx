'use client'

import { useState } from 'react'
import { authClient } from '@/platform/auth/client'
import { useQueryClient } from '@tanstack/react-query'

export function SignOut() {
  const client = useQueryClient()
  const [error, setError] = useState('')

  return (
    <>
      <button
        className="button-secondary"
        onClick={async () => {
          try {
            const result = await authClient.signOut()

            if (result.error) {
              throw result.error
            }

            client.clear()
            window.location.assign('/sign-in')
          } catch {
            setError('Unable to sign out. Try again.')
          }
        }}
      >
        Sign out
      </button>
      <span role="alert">{error}</span>
    </>
  )
}
