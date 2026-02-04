import Valkey from 'iovalkey'
import { feedbackValkeyKey } from '@navikt/syk-zara'

import { getValkey } from '../valkey/valkey'

export type Feedback = {
    id: string
    message: string
}

export type FeedbackClient = {
    create: (id: string, message: string) => Promise<void>
    // Dev only,
    dump: () => Promise<Feedback[]>
}

function createFeedbackClient(valkey: Valkey): FeedbackClient {
    return {
        create: async (id, message) => {
            const key = feedbackValkeyKey(id)

            await valkey.hset(key, {
                message: message,
            })
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
                        message: data.message || '',
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
