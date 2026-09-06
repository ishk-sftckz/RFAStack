import { getPreferences } from '../server/membership.queries'

export async function SavedPreferences() {
  const saved = await getPreferences()

  return (
    <>
      <p>Saved delivery preference: {saved.preference}</p>
      <p>Default queue filter: {saved.savedFilter}</p>
    </>
  )
}
