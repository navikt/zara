'use server'

import { validateUserSession } from '@services/auth/auth'
import { markSykmeldingPoisonPilled } from '@services/syk-inn-api/jobs/syk-inn-api-service'

export async function markSykmeldingPoisonPill(uuid: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')

    await markSykmeldingPoisonPilled(uuid, user)
}
