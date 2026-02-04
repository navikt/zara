import * as R from 'remeda'
import { logger } from '@navikt/next-logger'
import Valkey from 'iovalkey'
import { faker } from '@faker-js/faker'
import { subDays } from 'date-fns'
import { FEEDBACK_KEY_PREFIX } from '@navikt/syk-zara'

import { bundledEnv } from '@lib/env'
import { raise } from '@lib/ts'

import { FeedbackClient } from '../services/feedback/feedback-client'

export async function seedDevelopmentFeedback(client: FeedbackClient): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') {
        raise("What the hell are you doing?! Don't seed any cloud environments! :angst:")
    }

    const range = R.range(0, 50)
    logger.info(`Seeding valkey with ${range.length} feedback entries...`)
    for (const {} of range) {
        const id = crypto.randomUUID()

        await client.create(id, {
            message: faker.lorem.lines({ min: 1, max: 5 }),
            timestamp: faker.date.between({ from: subDays(new Date(), 60), to: Date.now() }).toISOString(),
            contact: faker.helpers.arrayElement(['PHONE', 'EMAIL', 'NONE']),
        })
    }
    logger.info(`Seeding valkey done!`)
}

export async function clearDevelopmentFeedback(valkey: Valkey): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') {
        raise('⚠️☠️🚨 You are trying to clear feedback in a non-development environment! 🚨☠️⚠️')
    }

    const feedbackKeys = await valkey.keys(`${FEEDBACK_KEY_PREFIX}*`)
    logger.warn(`Deleting all feedback entries (${feedbackKeys.length}) in Valkey...`)
    feedbackKeys.forEach((key) => valkey.del(key))
}
