import { NextConfig } from 'next'

const nextConfig: NextConfig = {
    output: 'standalone',
    assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX,
    transpilePackages: ['@navikt/syk-zara'],
    serverExternalPackages: [
        '@slack/bolt',
        '@valkey/valkey-glide',
        '@navikt/next-logger',
        'next-logger',
        'pino',
        'pino-socket',
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
        // Allow multipart overhead around the quiz's 2 MB image limit.
        serverActions: { bodySizeLimit: '3mb' },
        useTypeScriptCli: true,
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
