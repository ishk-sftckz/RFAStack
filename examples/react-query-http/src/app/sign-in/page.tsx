import { SignIn } from '@/features/identity/ui/SignIn'

export default function Page() {
  return (
    <>
      <h1>Sign in</h1>
      <SignIn />
      <p>
        Demo: north@example.test, south@example.test, or supervisor@example.test. Password:
        Demo-password-123!
      </p>
    </>
  )
}
