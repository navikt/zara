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

type PostgresConfig = z.infer<typeof PostgresConfigSchema>
const PostgresConfigSchema = z.object({
    host: z.string(),
    port: z.coerce.number(),
    username: z.string(),
    password: z.string(),
    database: z.string(),
})

type KafkaConfig = z.infer<typeof KafkaConfigSchema>
const KafkaConfigSchema = z.union([
    z.object({
        runtimeEnv: z.union([z.literal('dev-gcp'), z.literal('prod-gcp')]),
        brokers: z.string(),
        certificate: z.string(),
        privateKey: z.string(),
        ca: z.string(),
    }),
    z.object({
        runtimeEnv: z.literal('local'),
        brokers: z.string(),
    }),
])

type ValkeyConfig = z.infer<typeof ValkeyConfigSchema>
const ValkeyConfigSchema = z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    host: z.string(),
    port: z.coerce.number(),
    tls: z.boolean(),
})

type ServerEnv = z.infer<typeof ServerEnvSchema>
const ServerEnvSchema = z.object({
    useSykInnValkey: z.stringbool().nullish(),
    valkeyConfig: ValkeyConfigSchema,
    postgresConfig: PostgresConfigSchema,
    kafkaConfig: KafkaConfigSchema,
    zaraSlackAppToken: z.string(),
    zaraSlackBotToken: z.string(),
    zaraSlackChannelId: z.string(),
    tsmAwaySlackChannelId: z.string(),
    queryParamEncryptionSecret: z.string(),
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
    const valkeyConfig = {
        username: process.env.VALKEY_USERNAME_SYK_INN,
        password: process.env.VALKEY_PASSWORD_SYK_INN,
        host: process.env.VALKEY_HOST_SYK_INN,
        port: process.env.VALKEY_PORT_SYK_INN,
        // If VALKEY_URI_SYK_INN is set, it means we're in nais cloud
        tls: process.env.VALKEY_URI_SYK_INN != null,
    } satisfies Record<KeysOfUnion<ValkeyConfig>, unknown>

    const postgresConfig = {
        host: process.env.PGHOST,
        port: process.env.PGPORT,
        username: process.env.PGUSER,
        password: process.env.PGPASSWORD,
        database: process.env.PGDATABASE,
    } satisfies Record<KeysOfUnion<PostgresConfig>, unknown>

    const kafkaConfig = {
        runtimeEnv: process.env.NEXT_PUBLIC_RUNTIME_ENV,
        brokers: process.env.KAFKA_BROKERS,
        certificate: process.env.KAFKA_CERTIFICATE,
        privateKey: process.env.KAFKA_PRIVATE_KEY,
        ca: process.env.KAFKA_CA,
    } satisfies Record<KeysOfUnion<KafkaConfig>, unknown>

    const parsedEnv = ServerEnvSchema.parse({
        useSykInnValkey: process.env.USE_SYK_INN_VALKEY,
        valkeyConfig: valkeyConfig,
        postgresConfig: postgresConfig,
        kafkaConfig: kafkaConfig,
        zaraSlackAppToken: process.env.ZARA_SLACK_APP_TOKEN,
        zaraSlackBotToken: process.env.ZARA_SLACK_BOT_TOKEN,
        zaraSlackChannelId: process.env.ZARA_SLACK_CHANNEL_ID,
        tsmAwaySlackChannelId: process.env.TSM_AWAY_SLACK_CHANNEL_ID,
        queryParamEncryptionSecret: process.env.QUERY_PARAM_ENCRYPTION_SECRET,
    } satisfies Record<keyof ServerEnv, unknown>)

    if (bundledEnv.runtimeEnv !== 'local' && parsedEnv.useSykInnValkey) {
        raise('USE_SYK_INN_VALKEY should only be set to true in local environment')
    }

    return parsedEnv
}
