import { NextConfig } from 'next'

const nextConfig: NextConfig = {
    output: 'standalone',
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
    transpilePackages: ['@navikt/syk-zara'],
    serverExternalPackages: [
        '@slack/bolt',
        '@navikt/next-logger',
        'next-logger',
        'pino',
        'pino-socket',
        '@whatwg-node',
        'prom-client',
    ],
    // NextJS module tracer misses the `module-sync` export condition (-> require.mjs) for these packages
    outputFileTracingIncludes: {
        '/': [
            // Dependency of pino
            'real-require',
            // Because of @slack/bolt
            './node_modules/async-function/**',
            './node_modules/generator-function/**',
            './node_modules/async-generator-function/**',
        ],
    },
    experimental: {
        optimizePackageImports: ['@navikt/ds-react', '@navikt/aksel-icons'],
        authInterrupts: true,
        serverActions: { bodySizeLimit: '2mb' },
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
