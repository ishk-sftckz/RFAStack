import Link from 'next/link'
import { Icon } from '@/shared/ui/Icon'

export default function Page() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Company purchasing</p>
          <h1>Purchasing, with a clear next step.</h1>
          <p className="lead">
            Choose supplies from your company catalog, submit a purchase order, and follow its
            approval.
          </p>
          <Link className="button" href="/account">
            Open company workspace
            <Icon name="arrow" />
          </Link>
          <p className="hint">Try the workflow with a demo account.</p>
        </div>
        <div className="hero-guide">
          <p className="eyebrow">From start to finish</p>
          <ol className="steps">
            <li>
              <span className="step-number">01</span>
              <div>
                <h3>Build your request</h3>
                <p>Choose products and review your total.</p>
              </div>
            </li>
            <li>
              <span className="step-number">02</span>
              <div>
                <h3>Submit for approval</h3>
                <p>Send the purchase order to your company approver.</p>
              </div>
            </li>
            <li>
              <span className="step-number">03</span>
              <div>
                <h3>Review the decision</h3>
                <p>See approved and rejected requests in your workspace.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <div className="grid">
        <section>
          <p className="eyebrow">For buyers</p>
          <h2>Review before you submit</h2>
          <p className="muted">
            Adjust quantities and see your draft total before sending a request. Submitted orders
            stay in your workspace so you can follow each decision.
          </p>
        </section>
        <section>
          <p className="eyebrow">For approvers</p>
          <h2>Give each request a decision</h2>
          <p className="muted">
            Review the items and total in each purchase order. Approve or reject submitted requests
            for your company.
          </p>
        </section>
      </div>
    </>
  )
}
