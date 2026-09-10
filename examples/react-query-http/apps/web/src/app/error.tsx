'use client'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section>
      <h2>Unable to load this page</h2>
      <p role="alert">The request failed. Please try again.</p>
      <button onClick={reset}>Try again</button>
    </section>
  )
}
