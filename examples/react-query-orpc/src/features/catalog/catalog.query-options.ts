import { catalog } from './catalog.client'

export const catalogOptions = (scopeId: string) =>
  catalog.list.queryOptions({ input: { scopeId }, staleTime: 30000 })
