'use client'

import { useActionState, type ReactNode } from 'react'

export function ActionForm({
  action,
  children,
  label,
  disabled = false,
  buttonClassName,
}: {
  action: (previous: { message: string }, form: FormData) => Promise<{ message: string }>
  children?: ReactNode
  label: string
  disabled?: boolean
  buttonClassName?: string
}) {
  const [state, submit, pending] = useActionState(action, { message: '' })

  return (
    <form action={submit}>
      {children}
      <button className={buttonClassName} disabled={pending || disabled}>
        {pending ? 'Saving…' : label}
      </button>
      <p role="status">{state.message}</p>
    </form>
  )
}
