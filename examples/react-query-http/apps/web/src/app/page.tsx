import Link from 'next/link'
import { Icon } from '@/shared/ui/Icon'

export default function Page() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Warehouse operations</p>
          <h1>Keep every shipment moving.</h1>
          <p className="lead">
            See what needs packing, dispatch orders, and follow shipments through delivery.
          </p>
          <Link className="button" href="/account">
            Open dashboard
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
                <h3>Find your shipment</h3>
                <p>Search the queue or filter by status.</p>
              </div>
            </li>
            <li>
              <span className="step-number">02</span>
              <div>
                <h3>Pack and dispatch</h3>
                <p>Move each shipment to its next step.</p>
              </div>
            </li>
            <li>
              <span className="step-number">03</span>
              <div>
                <h3>Follow delivery</h3>
                <p>The queue checks for updates every five seconds.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <div className="grid">
        <section>
          <p className="eyebrow">Your warehouse</p>
          <h2>Focus on the next shipment</h2>
          <p className="muted">
            Your dashboard shows shipments for your assigned warehouse. Open a shipment to check its
            status, then pack or dispatch it when ready.
          </p>
        </section>
        <section>
          <p className="eyebrow">For supervisors</p>
          <h2>Keep product prices current</h2>
          <p className="muted">
            Supervisors can update product prices alongside the shipment queue. Save your delivery
            preference and default status filter for your next visit.
          </p>
        </section>
      </div>
    </>
  )
}
