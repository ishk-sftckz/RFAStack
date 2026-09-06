'use client'

import { useState } from 'react'
import { authClient } from '@/platform/auth/client'

export function SignOut() {
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
