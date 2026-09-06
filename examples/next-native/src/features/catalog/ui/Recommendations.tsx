import { getRecommendations } from '../catalog.queries'

export async function Recommendations() {
  const result = await getRecommendations()

  return (
    <section>
      <h2>Recommended for you</h2>
      <p>Delivery: {result.preference}</p>
      <ul>
        {result.products.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </section>
  )
}
