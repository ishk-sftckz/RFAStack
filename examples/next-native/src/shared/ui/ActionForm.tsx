'use client'

import { useActionState, type ReactNode } from 'react'

export function ActionForm({
  action,
  children,
  label,
}: {
  action: (previous: { message: string }, form: FormData) => Promise<{ message: string }>
  children?: ReactNode
  label: string
}) {
  const [state, submit, pending] = useActionState(action, { message: '' })

  return (
    <form action={submit}>
      {children}
      <button disabled={pending}>{pending ? 'Saving…' : label}</button>
      <p role="status">{state.message}</p>
    </form>
  )
}
