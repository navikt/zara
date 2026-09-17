import { AdminBruksvilkarClient, createAdminBruksvilkarClient } from '@navikt/syk-zara/bruksvilkar/admin'

import { realValkey } from '#services/db/valkey/production-valkey'

export async function getBruksvilkarClient(): Promise<AdminBruksvilkarClient> {
    const valkey = await realValkey()

    return createAdminBruksvilkarClient(valkey)
}
