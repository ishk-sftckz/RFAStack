import { SignIn } from '@/features/auth/ui/SignIn'
export default function Page() {
  return (
    <div className="auth-layout">
      <div className="auth-intro">
        <p className="eyebrow">Company purchasing</p>
        <h2>Keep purchasing organized.</h2>
        <p className="muted">
          Build a purchase order or review requests waiting for your approval.
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
            <li>alice@example.test — Company A buyer</li>
            <li>approver-a@example.test — Company A approver</li>
            <li>bob@example.test — Company B buyer</li>
            <li>approver-b@example.test — Company B approver</li>
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
