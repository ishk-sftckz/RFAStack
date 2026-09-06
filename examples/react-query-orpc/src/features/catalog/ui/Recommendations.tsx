import { getRecommendations } from '../catalog.queries'

export async function Recommendations() {
  const data = await getRecommendations()

  return (
    <section>
      <h2>Suggested reorders</h2>
      <p>Delivery: {data.preference}</p>
      <ul>
        {data.products.map((p) => (
          <li key={p.id}>{p.name}</li>
        ))}
      </ul>
    </section>
  )
}
