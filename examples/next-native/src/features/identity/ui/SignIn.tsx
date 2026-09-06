'use client'

import { useState, type FormEvent } from 'react'
import { authClient } from '../identity.client'

export function SignIn() {
  const [message, setMessage] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setMessage('')
    const form = new FormData(event.currentTarget)

    try {
      const result = await authClient.signIn.email({
        email: String(form.get('email')),
        password: String(form.get('password')),
      })

      if (result.error) {
        setMessage(result.error.message ?? 'Unable to sign in.')

        return
      }

      window.location.assign('/account')
    } catch {
      setMessage('Unable to reach the server. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={submit} aria-busy={pending}>
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input name="password" type="password" autoComplete="current-password" required />
      </label>
      <button disabled={pending}>{pending ? 'Signing in…' : 'Sign in'}</button>
      <p role="alert">{message}</p>
    </form>
  )
}

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
