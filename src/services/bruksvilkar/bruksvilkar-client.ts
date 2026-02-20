import { AdminBruksvilkarClient, createAdminBruksvilkarClient } from '@navikt/syk-zara/bruksvilkar/admin'

import { valkeyClient } from '@services/db/valkey/production-valkey'

export function getBruksvilkarClient(): AdminBruksvilkarClient {
    const valkey = valkeyClient()

    return createAdminBruksvilkarClient(valkey)
}
