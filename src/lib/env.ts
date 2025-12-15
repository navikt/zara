import * as z from 'zod'

import { raise } from './ts'

export type BundledEnv = z.infer<typeof BundledEnvSchema>
const BundledEnvSchema = z.object({
    runtimeEnv: z.union([z.literal('local'), z.literal('prod-gcp'), z.literal('dev-gcp')]),
    NEXT_PUBLIC_ASSET_PREFIX: z.string().nullish(),
    NEXT_PUBLIC_VERSION: z.string().nullish(),
    NEXT_PUBLIC_BUILD_TIME: z.string().nullish(),
})

/**
 * Next.js will bundle any environment variables that start with NEXT_PUBLIC_ into the
 * client bundle. These are available at any time, statically, in both server and browser.
 */
export const bundledEnv = BundledEnvSchema.parse({
    runtimeEnv: process.env.NEXT_PUBLIC_RUNTIME_ENV,
    NEXT_PUBLIC_ASSET_PREFIX: process.env.NEXT_PUBLIC_ASSET_PREFIX,
    NEXT_PUBLIC_VERSION: process.env.NEXT_PUBLIC_VERSION,
    NEXT_PUBLIC_BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME,
} satisfies Record<keyof BundledEnv, unknown>)

type ServerEnv = z.infer<typeof ServerEnvSchema>
const ServerEnvSchema = z.object({
    useLocalSykInnApi: z.boolean().default(false),
    localSykInnApiHost: z.string().default('localhost:8080'),
})

/**
 * Pure server environment variables (i.e. not prefixed with NEXT_PUBLIC_) are only available
 * at runtime, and only on the server. Because these are strongly typed, they need to be accessed
 * lazily, otherwise the build would fail because of Next.js aggressive static optimizations.
 *
 * This can also be used in /api/internal/is_ready to verify that
 * the server is configured correctly before receiving any traffic.
 */
export function getServerEnv(): ServerEnv {
    const parsedEnv = ServerEnvSchema.parse({
        useLocalSykInnApi: process.env.USE_LOCAL_SYK_INN_API === 'true',
        localSykInnApiHost: process.env.LOCAL_SYK_INN_API_HOST,
    } satisfies Record<keyof ServerEnv, unknown | undefined>)

    if (bundledEnv.runtimeEnv !== 'local' && parsedEnv.useLocalSykInnApi) {
        raise('USE_LOCAL_SYK_INN_API should only be set to true in local environment')
    }

    return parsedEnv
}
