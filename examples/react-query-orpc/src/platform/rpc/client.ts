import { RPCLink } from '@orpc/client/fetch'

export const rpcLink = new RPCLink({
  url: () => {
    if (typeof window === 'undefined') {
      throw new Error('Use a direct server query')
    }

    return new URL('/api/rpc', window.location.origin).toString()
  },
})
