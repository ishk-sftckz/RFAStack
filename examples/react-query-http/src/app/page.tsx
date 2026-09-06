import Link from 'next/link'

export default function Page() {
  return (
    <>
      <h1>Fulfillment dashboard</h1>
      <p>Pack and dispatch shipments for your warehouse.</p>
      <Link href="/account">Open dashboard</Link>
    </>
  )
}
