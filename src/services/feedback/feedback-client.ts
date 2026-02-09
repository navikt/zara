import { AdminFeedbackClient, createAdminFeedbackClient } from '@navikt/syk-zara/admin'

import { valkeyClient } from '@services/valkey/production-valkey'

export function getFeedbackClient(): AdminFeedbackClient {
    const valkey = valkeyClient()

    return createAdminFeedbackClient(valkey)
}
