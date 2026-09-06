import Link from 'next/link'

export default function Page() {
  return (
    <>
      <h1>B2B ordering</h1>
      <p>Submit purchase orders and approve purchases for your company.</p>
      <Link href="/account">Open company workspace</Link>
    </>
  )
}
