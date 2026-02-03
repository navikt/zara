import * as R from 'remeda'
import { logger } from '@navikt/next-logger'

import { FeedbackClient } from '../services/feedback/feedback-client'

export async function seedInMemValkey(client: FeedbackClient): Promise<void> {
    const range = R.range(0, 50)
    for (const index of range) {
        const id = crypto.randomUUID()

        logger.info(`Seeding valkey ${index}... id=${id}`)

        await client.create(id, `Melding nummer ${index}`)
    }
}
