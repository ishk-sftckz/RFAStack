import { SignIn } from '@/features/identity/ui/SignIn'

export default function Page() {
  return (
    <>
      <h1>Sign in</h1>
      <SignIn />
      <p>Demo: alice@example.test or bob@example.test. Password: Demo-password-123!</p>
    </>
  )
}
