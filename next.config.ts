import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  // Exclude native binaries from the server bundle
  serverExternalPackages: ['better-sqlite3'],
}

export default nextConfig
