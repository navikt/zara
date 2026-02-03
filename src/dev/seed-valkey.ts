import * as R from 'remeda'
import { logger } from '@navikt/next-logger'

import { bundledEnv } from '@lib/env'
import { raise } from '@lib/ts'

import { FeedbackClient } from '../services/feedback/feedback-client'

export async function seedDevelopmentValkey(client: FeedbackClient): Promise<void> {
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
