import { SignIn } from '@/features/auth/ui/SignIn'
export default function Page() {
  return (
    <div className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">Fulfillment</p>
        <h2>Your warehouse, ready for the day.</h2>
        <p className="muted">
          Find your shipments, move them through the queue, and check what needs attention.
        </p>
        <p className="hint">Use a demo account to try the workspace.</p>
      </div>
      <section className="auth-card">
        <p className="eyebrow">Welcome back</p>
        <h1>Sign in</h1>
        <p className="muted">Enter your email and password to continue.</p>
        <SignIn />
        <details className="demo-accounts">
          <summary>View demo accounts</summary>
          <ul>
            <li>north@example.test — North operator</li>
            <li>south@example.test — South operator</li>
            <li>supervisor@example.test — North supervisor</li>
          </ul>
          <p className="hint">
            Password for all demo accounts:
            <br />
            <code>Demo-password-123!</code>
          </p>
        </details>
      </section>
    </div>
  )
}
