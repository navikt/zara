import Valkey from 'iovalkey'
import * as R from 'remeda'
import { logger } from '@navikt/next-logger'

import { UserActivity } from '@services/live-service/pages'
import { subscriberValkeyClient, valkeyClient } from '@services/db/valkey/production-valkey'

const CHANNELS = {
    ACTIVITY: 'channel:user-activity',
}

export type UserActivityPubSubClient = {
    userActive: (activity: UserActivity) => Promise<void>
    sub: (channels: { onActivity?: (activity: UserActivity) => Promise<void> }) => Promise<() => Promise<void>>
}

function createUserActivityPubSubClient(valkey: Valkey, subValkey: Valkey): UserActivityPubSubClient {
    return {
        userActive: async (activity) => {
            await valkey.publish(CHANNELS.ACTIVITY, JSON.stringify(activity))
        },
        sub: async (channels) => {
            const toSubscribeTo = [channels.onActivity != null ? CHANNELS.ACTIVITY : null].filter(R.isNonNull)

            logger.info(`Setting up subscriptions to ${toSubscribeTo.join(', ')}`)
            await subValkey.subscribe(...toSubscribeTo)

            const handler = async (channel: string, message: string): Promise<void> => {
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

            subValkey.on('message', handler)

            return async () => {
                subValkey.removeListener('message', handler)

                await subValkey.unsubscribe()
            }
        },
    }
}

export function createUserActivityClient(): UserActivityPubSubClient {
    const valkey = valkeyClient()
    const subValkey = subscriberValkeyClient()

    return createUserActivityPubSubClient(valkey, subValkey)
}
