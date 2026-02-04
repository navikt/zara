import Valkey from 'iovalkey'
import * as R from 'remeda'
import { FEEDBACK_KEY_PREFIX, feedbackValkeyKey } from '@navikt/syk-zara'

import { getValkey } from '../valkey/valkey'

export type Feedback = {
    id: string
    name: string
    message: string
    timestamp: string
    contact: string
}

export type FeedbackClient = {
    create: (id: string, feedback: Omit<Feedback, 'id'>) => Promise<void>
    all: () => Promise<Feedback[]>
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
    }
}

export function getFeedbackClient(valkey?: Valkey): FeedbackClient {
    const feedbackClient = createFeedbackClient(valkey ?? getValkey())

    return feedbackClient
}
