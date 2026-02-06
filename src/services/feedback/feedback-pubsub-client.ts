import Valkey from 'iovalkey'
import * as R from 'remeda'
import { logger } from '@navikt/next-logger'

const CHANNELS = {
    NEW: 'channel:new-feedback',
    UPDATED: 'channel:feedback-updated',
    DELETED: 'channel:feedback-deleted',
}

export type FeedbackPubsubClient = {
    pub: {
        new: (id: string) => Promise<void>
        update: (id: string) => Promise<void>
        deleted: (id: string) => Promise<void>
    }
    sub: (channels: {
        new?: (id: string) => Promise<void>
        updated?: (id: string) => Promise<void>
        deleted?: (id: string) => Promise<void>
    }) => Promise<() => Promise<void>>
}

export function createFeedbackPubSubClient(valkey: Valkey, subValkey: Valkey): FeedbackPubsubClient {
    return {
        pub: {
            new: async (id) => {
                await valkey.publish(CHANNELS.NEW, id)
            },
            update: async (id) => {
                await valkey.publish(CHANNELS.UPDATED, id)
            },
            deleted: async (id) => {
                await valkey.publish(CHANNELS.DELETED, id)
            },
        },
        sub: async (channels) => {
            const toSubscribeTo = [
                channels.new != null ? CHANNELS.NEW : null,
                channels.updated != null ? CHANNELS.UPDATED : null,
                channels.deleted != null ? CHANNELS.DELETED : null,
            ].filter(R.isNonNull)

            logger.info(`Setting up subscriptions to ${toSubscribeTo.join(', ')}`)
            await subValkey.subscribe(...toSubscribeTo)

            const handler = async (channel: string, message: string): Promise<void> => {
                switch (channel) {
                    case CHANNELS.NEW:
                        if (channels.new) await channels.new(message)
                        break
                    case CHANNELS.UPDATED:
                        if (channels.updated) await channels.updated(message)
                        break
                    case CHANNELS.DELETED:
                        if (channels.deleted) await channels.deleted(message)
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
