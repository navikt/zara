'use server'

import { liveService } from '@services/live-service/users'
import { userInfo } from '@services/auth/auth'

export async function pingMe(): Promise<'pong' | 'no'> {
    const user = await userInfo()
    if (!user) return 'no'

    liveService.userOnPage({ oid: user.oid, name: user.name }, '/syk-inn/tilbakemeldinger')

    return 'pong'
}
