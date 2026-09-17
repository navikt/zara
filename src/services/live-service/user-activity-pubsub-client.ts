import { logger } from '@navikt/next-logger'
import { GlideClient, GlideClientConfiguration, PubSubMsg } from '@valkey/valkey-glide'
import * as R from 'remeda'

import { spanServerAsync } from '#lib/otel/server'
import { getGlideClientConfig, realValkey } from '#services/db/valkey/production-valkey'
import { UserActivity } from '#services/live-service/pages'

const CHANNELS = {
    ACTIVITY: 'channel:user-activity',
}

export type UserActivityPubSubClient = {
    userActive: (activity: UserActivity) => Promise<void>
    sub: (
        channels: { onActivity?: (activity: UserActivity) => Promise<void> },
        signal?: AbortSignal,
    ) => Promise<() => Promise<void>>
}

function createUserActivityPubSubClient(valkey: GlideClient): UserActivityPubSubClient {
    return {
        userActive: async (activity) => {
            await valkey.publish(JSON.stringify(activity), CHANNELS.ACTIVITY)
        },
        sub: async (channels, signal) => {
            const toSubscribeTo = [channels.onActivity != null ? CHANNELS.ACTIVITY : null].filter(R.isNonNull)

            if (signal?.aborted) return async () => {}

            const handler = async (msg: PubSubMsg): Promise<void> => {
                const channel = String(msg.channel)
                const message = String(msg.message)

                switch (channel) {
                    case CHANNELS.ACTIVITY:
                        if (channels.onActivity) {
                            try {
                                const activity: UserActivity = JSON.parse(message)
                                await channels.onActivity(activity)
                            } catch (e) {
                                logger.error(
                                    new Error(`Failed to parse message on ${CHANNELS.ACTIVITY}: ${message}`, {
                                        cause: e,
                                    }),
                                )
                            }
                        }
                        break
                    default:
                        // Irrelevant channel
                        break
                }
            }

            logger.info(`Setting up subscriptions to ${toSubscribeTo.join(', ')}`)
            const subValkey = await GlideClient.createClient({
                ...getGlideClientConfig(),
                pubsubSubscriptions: {
                    channelsAndPatterns: {
                        [GlideClientConfiguration.PubSubChannelModes.Exact]: new Set(toSubscribeTo),
                    },
                    callback: handler,
                },
            })

            // The client may have disconnected while the connection was being established; close now
            // so the freshly-created subscriber isn't left to be dropped mid-handshake by glide's core.
            if (signal?.aborted) {
                subValkey.close()
                return async () => {}
            }

            return async () =>
                spanServerAsync('FeedbackSubClient.unsubscribe', async () => {
                    subValkey.close()
                })
        },
    }
}

export async function createUserActivityClient(): Promise<UserActivityPubSubClient> {
    const valkey = await realValkey()

    return createUserActivityPubSubClient(valkey)
}
