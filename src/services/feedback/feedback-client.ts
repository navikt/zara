import Valkey from 'iovalkey'
import * as R from 'remeda'
import { FEEDBACK_KEY_PREFIX, feedbackValkeyKey } from '@navikt/syk-zara'

import { raise } from '@lib/ts'
import { valkeyClient, subscriberValkeyClient } from '@services/valkey/production-valkey'

import { createFeedbackPubSubClient, FeedbackPubsubClient } from './feedback-pubsub-client'
import { Feedback, FeedbackSchema } from './feedback-schema'

export type FeedbackClient = {
    create: (id: string, feedback: Omit<Feedback, 'id' | 'redactionLog'>) => Promise<void>
    delete: (id: string) => Promise<void>
    all: () => Promise<Feedback[]>
    byId: (id: string) => Promise<Feedback | null>
    redactFeedback: (id: string, message: string, whom: { name: string; count: number }) => Promise<void>
    mark: {
        verified: (id: string, by: string) => Promise<void>
        contacted: (id: string, by: string) => Promise<void>
    }
}

function createFeedbackClient(valkey: Valkey, pubsub: FeedbackPubsubClient): FeedbackClient {
    return {
        all: async () => {
            const allkeys = await valkey.keys(`${FEEDBACK_KEY_PREFIX}*`)
            const feedback = await Promise.all(
                allkeys.map(async (key) => {
                    const data = await valkey.hgetall(key)

                    return FeedbackSchema.parse(data)
                }),
            )

            return R.sortBy(feedback, [(it) => it.timestamp, 'desc'])
        },
        byId: async (id) => {
            const key = feedbackValkeyKey(id)

            const data = await valkey.hgetall(key)
            if (Object.keys(data).length === 0) {
                return null
            }

            return FeedbackSchema.parse(data)
        },
        create: async (id, feedback) => {
            const key = feedbackValkeyKey(id)

            await valkey.hset(key, {
                id: id,
                ...feedback,
                redactionLog: JSON.stringify([]),
            } satisfies Record<keyof Feedback, unknown>)

            pubsub.pub.new(id)
        },
        delete: async (id) => {
            const key = feedbackValkeyKey(id)

            const exists = await valkey.exists(key)
            if (exists !== 1) return

            await valkey.del(key)

            pubsub.pub.deleted(id)
        },
        redactFeedback: async (id, message, whom) => {
            const key = feedbackValkeyKey(id)
            const existingRedactionLog = await valkey.hget(key, 'redactionLog')
            const redactionLog = existingRedactionLog ? JSON.parse(existingRedactionLog) : []
            redactionLog.push({
                name: whom.name,
                count: whom.count,
                timestamp: new Date().toISOString(),
            })

            await valkey.hset(key, {
                message,
                redactionLog: JSON.stringify(redactionLog),
            })

            pubsub.pub.update(id)
        },
        mark: {
            verified: async (id, by) => {
                const key = feedbackValkeyKey(id)
                const existingAt = await valkey.hget(key, 'verifiedContentAt')
                if (existingAt) {
                    raise(`Unable to mark feedback as verified, it was already verified at ${existingAt}`)
                }

                await valkey.hset(key, {
                    verifiedContentAt: new Date().toISOString(),
                    verifiedContentBy: by,
                })

                pubsub.pub.update(id)
            },
            contacted: async (id, by) => {
                const key = feedbackValkeyKey(id)
                const existingAt = await valkey.hget(key, 'contactedAt')
                if (existingAt) {
                    raise(`Unable to mark feedback as contacted, it was already contacted at ${existingAt}`)
                }

                await valkey.hset(key, {
                    contactedAt: new Date().toISOString(),
                    contactedBy: by,
                })

                pubsub.pub.update(id)
            },
        },
    }
}

export function getFeedbackClient(): [FeedbackClient, FeedbackPubsubClient] {
    const valkey = valkeyClient()
    const subValkey = subscriberValkeyClient()

    const pubSubClient = createFeedbackPubSubClient(valkey, subValkey)
    const feedbackClient = createFeedbackClient(valkey, pubSubClient)

    return [feedbackClient, pubSubClient]
}
