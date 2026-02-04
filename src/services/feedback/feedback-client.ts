import Valkey from 'iovalkey'
import * as R from 'remeda'
import { FEEDBACK_KEY_PREFIX, feedbackValkeyKey } from '@navikt/syk-zara'

import { getValkey } from '../valkey/valkey'

export type Feedback = {
    id: string
    name: string
    message: string
    timestamp: string
    contactType: 'PHONE' | 'EMAIL' | 'NONE'
    contactDetails: string | null
    contactedAt: string | null
    contactedBy: string | null
}

export type FeedbackClient = {
    create: (id: string, feedback: Omit<Feedback, 'id'>) => Promise<void>
    all: () => Promise<Feedback[]>
    byId: (id: string) => Promise<Feedback | null>
}

function createFeedbackClient(valkey: Valkey): FeedbackClient {
    return {
        create: async (id, feedback) => {
            const key = feedbackValkeyKey(id)

            await valkey.hset(key, {
                id: id,
                ...feedback,
            })
        },
        all: async () => {
            const allkeys = await valkey.keys(`${FEEDBACK_KEY_PREFIX}*`)
            const feedback = await Promise.all(
                allkeys.map(async (key) => {
                    const data = await valkey.hgetall(key)
                    return {
                        // TODO this is poor typing
                        ...data,
                    } as Feedback
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

            return {
                // TODO this is poor typing
                ...data,
            } as Feedback
        },
    }
}

export function getFeedbackClient(valkey?: Valkey): FeedbackClient {
    const feedbackClient = createFeedbackClient(valkey ?? getValkey())

    return feedbackClient
}
