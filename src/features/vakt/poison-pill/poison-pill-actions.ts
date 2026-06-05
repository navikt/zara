'use server'

import { validateUserSession } from '@services/auth/auth'
import { markSykmeldingPoisonPilled } from '@services/apps/syk-inn-api/syk-inn-api-service'

export async function markSykmeldingPoisonPill(uuid: string, reason: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')

    await markSykmeldingPoisonPilled(uuid, reason, user)
}
