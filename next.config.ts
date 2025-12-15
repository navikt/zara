import { NextConfig } from 'next'

const nextConfig: NextConfig = {
    output: 'standalone',
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
    serverExternalPackages: [
        '@navikt/next-logger',
        'next-logger',
        'pino',
    ],
    experimental: {
        optimizePackageImports: ['@navikt/ds-react', '@navikt/aksel-icons'],
        globalNotFound: true
    },
    images: { remotePatterns: [new URL('https://cdn.nav.no/**')] },
    logging: {
        fetches: {
            fullUrl: true,
            hmrRefreshes: true,
        },
    },
    productionBrowserSourceMaps: true,
}

export default nextConfig
