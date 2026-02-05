'use server'

import { liveService } from '@services/live-service/users'
import { userInfo } from '@services/auth/auth'
import { Pages } from '@services/live-service/pages'

export async function meActive(page: Pages): Promise<'pong' | 'no'> {
    const user = await userInfo()
    if (!user) return 'no'

    liveService.userOnPage({ oid: user.oid, name: user.name }, page)

    return 'pong'
}
