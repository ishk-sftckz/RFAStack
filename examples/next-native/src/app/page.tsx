import Link from 'next/link'
import { Icon } from '@/shared/ui/Icon'
import { Suspense } from 'react'
import { Catalog } from '@/features/catalog/ui/Catalog'

export default function Page() {
  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Customer portal</p>
          <h1>Order supplies</h1>
          <p className="lead">
            Browse everyday essentials and place your next order. Your account keeps orders and
            delivery details together.
          </p>
          <Link className="button" href="/account">
            Open your account
            <Icon name="arrow" />
          </Link>
          <p className="hint">Demo orders only. No payment is taken.</p>
        </div>
        <div className="hero-guide">
          <p className="eyebrow">From start to finish</p>
          <ol className="steps">
            <li>
              <span className="step-number">01</span>
              <div>
                <h3>Choose your supplies</h3>
                <p>Browse the catalog and set your quantities.</p>
              </div>
            </li>
            <li>
              <span className="step-number">02</span>
              <div>
                <h3>Place an order</h3>
                <p>Review your total before placing an order.</p>
              </div>
            </li>
            <li>
              <span className="step-number">03</span>
              <div>
                <h3>Follow delivery</h3>
                <p>Open an order to check its current status.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <Suspense fallback={<p role="status">Loading catalog…</p>}>
        <Catalog />
      </Suspense>
    </>
  )
}
