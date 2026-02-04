import Valkey from 'iovalkey'
import { feedbackValkeyKey } from '@navikt/syk-zara'

import { getValkey } from '../valkey/valkey'

export type Feedback = {
    id: string
    message: string
    timestamp: string
    contact: string
}

export type FeedbackClient = {
    create: (id: string, feedback: Omit<Feedback, 'id'>) => Promise<void>
    // Dev only,
    dump: () => Promise<Feedback[]>
}

function createFeedbackClient(valkey: Valkey): FeedbackClient {
    return {
        create: async (id, feedback) => {
            const key = feedbackValkeyKey(id)

            await valkey.hset(key, feedback)
        },
        dump: async () => {
            const pattern = 'feedback:*'
            const keys = await valkey.keys(pattern)

            const results = await Promise.all(
                keys.map(async (key) => {
                    const data = await valkey.hgetall(key)
                    // Extract id from key (remove "feedback:" prefix)
                    const id = key.replace(/^feedback:/, '')
                    return {
                        id,
                        // TODO: Zod based mapping probably
                        message: data.message || '',
                        timestamp: data.timestamp || '',
                        contact: data.contact || '',
                    }
                }),
            )

            return results
        },
    }
}

export function getFeedbackClient(valkey?: Valkey): FeedbackClient {
    const feedbackClient = createFeedbackClient(valkey ?? getValkey())

    return feedbackClient
}
