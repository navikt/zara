import * as R from 'remeda'
import { logger } from '@navikt/next-logger'
import Valkey from 'iovalkey'

import { bundledEnv } from '@lib/env'
import { raise } from '@lib/ts'

import { FeedbackClient } from '../services/feedback/feedback-client'

export async function seedDevelopmentFeedback(client: FeedbackClient): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') {
        raise("What the hell are you doing?! Don't seed any cloud environments! :angst:")
    }

    const range = R.range(0, 50)
    for (const index of range) {
        const id = crypto.randomUUID()

        logger.info(`Seeding valkey ${index}... id=${id}`)

        await client.create(id, `Melding nummer ${index}`)
    }
}

export async function clearDevelopmentFeedback(valkey: Valkey): Promise<void> {
    if (bundledEnv.runtimeEnv !== 'local') {
        raise('⚠️☠️🚨 You are trying to clear feedback in a non-development environment! 🚨☠️⚠️')
    }

    const feedbackKeys = await valkey.keys('feedback:*')
    logger.warn(`Deleting all feedback entries (${feedbackKeys.length}) in Valkey...`)
    feedbackKeys.forEach((key) => valkey.del(key))
}
