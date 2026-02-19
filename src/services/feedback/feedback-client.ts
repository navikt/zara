import { AdminFeedbackClient, createAdminFeedbackClient } from '@navikt/syk-zara/feedback/admin'

import { valkeyClient } from '@services/valkey/production-valkey'

export function getFeedbackClient(): AdminFeedbackClient {
    const valkey = valkeyClient()

    return createAdminFeedbackClient(valkey)
}
