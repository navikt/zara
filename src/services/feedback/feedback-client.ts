import Valkey from 'iovalkey'
import * as R from 'remeda'
import { FEEDBACK_KEY_PREFIX, feedbackValkeyKey } from '@navikt/syk-zara'

import { getValkey } from '../valkey/valkey'

import { Feedback, FeedbackSchema } from './feedback-schema'

export type FeedbackClient = {
    create: (id: string, feedback: Omit<Feedback, 'id' | 'redactionLog'>) => Promise<void>
    all: () => Promise<Feedback[]>
    byId: (id: string) => Promise<Feedback | null>
    updateFeedback: (id: string, message: string, whom: { name: string; count: number }) => Promise<void>
}

function createFeedbackClient(valkey: Valkey): FeedbackClient {
    return {
        create: async (id, feedback) => {
            const key = feedbackValkeyKey(id)

            await valkey.hset(key, {
                id: id,
                ...feedback,
                redactionLog: JSON.stringify([]),
            } satisfies Record<keyof Feedback, unknown>)
        },
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
        updateFeedback: async (id, message, whom) => {
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
        },
    }
}

export function getFeedbackClient(valkey?: Valkey): FeedbackClient {
    const feedbackClient = createFeedbackClient(valkey ?? getValkey())

    return feedbackClient
}
