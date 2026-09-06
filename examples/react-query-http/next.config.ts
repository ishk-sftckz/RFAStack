import type { NextConfig } from 'next'

const config: NextConfig = { cacheComponents: true, turbopack: { root: process.cwd() } }

export default config
