'use server'

import { userInfo } from '@services/auth/auth'
import { Pages } from '@services/live-service/pages'
import { createUserActivityClient } from '@services/live-service/user-activity-pubsub-client'

export async function meActive(page: Pages): Promise<'pong' | 'no'> {
    const user = await userInfo()
    if (!user) return 'no'

    const pubsub = createUserActivityClient()
    await pubsub.userActive({ oid: user.oid, name: user.name, page })

    return 'pong'
}
