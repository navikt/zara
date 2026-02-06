'use server'

import { userInfo } from '@services/auth/auth'
import { Pages } from '@services/feedback/pages'
import { getFeedbackClient } from '@services/feedback/feedback-client'

export async function meActive(page: Pages): Promise<'pong' | 'no'> {
    const user = await userInfo()
    if (!user) return 'no'

    const [, pubsub] = getFeedbackClient()
    await pubsub.pub.userActive({ oid: user.oid, name: user.name, page })

    return 'pong'
}
