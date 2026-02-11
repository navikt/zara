import * as z from 'zod'

import { KeysOfUnion, raise } from './ts'

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

type ValkeyConfig = z.infer<typeof ValkeyConfigSchema>
const ValkeyConfigSchema = z.union([
    /**
     * Defines a union type for strongly typing Valkey configurations for local and production environments.
     * The local setup doesn't require authentication but does need the Docker image URL.
     */
    z.object({
        runtimeEnv: z.union([z.literal('dev-gcp'), z.literal('prod-gcp')]),
        username: z.string(),
        password: z.string(),
        tls: z.object({
            host: z.string(),
            port: z.coerce.number(),
        }),
    }),
    z.object({
        runtimeEnv: z.literal('local'),
        host: z.string(),
        port: z.coerce.number().optional(),
    }),
])

type ServerEnv = z.infer<typeof ServerEnvSchema>
const ServerEnvSchema = z.object({
    useSykInnValkey: z.boolean().default(false),
    valkeyConfig: ValkeyConfigSchema.nullish(),
    zaraSlackBotToken: z.string(),
    zaraSlackChannelId: z.string(),
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
    const useLocalSykInn = process.env.USE_SYK_INN_VALKEY === 'true'
    const valkeyConfig = {
        runtimeEnv: process.env.NEXT_PUBLIC_RUNTIME_ENV,
        username: process.env.VALKEY_USERNAME_SYK_INN,
        password: process.env.VALKEY_PASSWORD_SYK_INN,
        host: useLocalSykInn ? 'localhost' : process.env.VALKEY_HOST_SYK_INN,
        // Local
        port: useLocalSykInn ? undefined : process.env.VALKEY_PORT_SYK_INN,
        // Cloud
        tls: {
            host: process.env.VALKEY_HOST_SYK_INN,
            port: process.env.VALKEY_PORT_SYK_INN,
        },
    } satisfies Record<KeysOfUnion<ValkeyConfig>, unknown>

    const parsedEnv = ServerEnvSchema.parse({
        useSykInnValkey: useLocalSykInn,
        valkeyConfig: valkeyConfig,
        zaraSlackBotToken: process.env.ZARA_SLACK_BOT_TOKEN,
        zaraSlackChannelId: process.env.ZARA_SLACK_CHANNEL_ID,
    } satisfies Record<keyof ServerEnv, unknown | undefined>)

    if (bundledEnv.runtimeEnv !== 'local' && parsedEnv.useSykInnValkey) {
        raise('USE_SYK_INN_VALKEY should only be set to true in local environment')
    }

    return parsedEnv
}
