import { catalog } from './catalog.rpc-client'

export const catalogOptions = (scopeId: string) =>
  catalog.list.queryOptions({ input: { scopeId }, staleTime: 30000 })
