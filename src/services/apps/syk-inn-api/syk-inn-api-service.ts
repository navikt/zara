import { logger } from '@navikt/next-logger'

import { bundledEnv } from '#lib/env'
import { raise } from '#lib/ts'
import { getOboToken } from '#services/apps/common/obo'
import { User } from '#services/auth/user'

const SYK_INN_API_ADMIN = 'http://syk-inn-api/internal/admin'

export async function markSykmeldingPoisonPilled(uuid: string, reason: string, user: User): Promise<void> {
    if (bundledEnv.runtimeEnv === 'local') {
        logger.warn(`Mock report ${uuid} as poison pill by user ${user.userId}`)

        if (!reason) {
            throw new Error('Missing reason')
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
        return
    }

    const oboToken = await getOboToken('syk-inn-api')
    const response = await fetch(`${SYK_INN_API_ADMIN}/poison-pills/${uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}` },
        body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
        raise(`Failed to change job status in syk-inn-api: ${response.status} ${response.statusText}`)
    }

    return response.json()
}
