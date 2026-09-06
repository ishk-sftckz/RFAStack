import { SignIn } from '@/features/identity/ui/SignIn'
export default function Page() {
  return (
    <div className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">Customer portal</p>
        <h2>Make room for your next order.</h2>
        <p className="muted">
          Choose your supplies, check your orders, and keep track of delivery.
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
            <li>alice@example.test — Customer</li>
            <li>bob@example.test — Customer</li>
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
