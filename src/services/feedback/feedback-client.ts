import { AdminFeedbackClient, createAdminFeedbackClient } from '@navikt/syk-zara/feedback/admin'

import { realValkey } from '#services/db/valkey/production-valkey'

export async function getFeedbackClient(): Promise<AdminFeedbackClient> {
    const valkey = await realValkey()

    return createAdminFeedbackClient(valkey)
}
