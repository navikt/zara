'use server'

import { unauthorized } from 'next/navigation'
import { revalidatePath } from 'next/cache'

import { validateUserSession } from '@services/auth/auth'
import { getFeedbackClient } from '@services/feedback/feedback-client'

export async function setFeedbackVerified(id: string): Promise<{ ok: boolean }> {
    const user = await validateUserSession()
    const [client] = getFeedbackClient()

    const feedback = await client.byId(id)
    if (!feedback) unauthorized()

    await client.mark.verified(id, user.name)

    revalidatePath(`/syk-inn/tilbakemeldinger/${id}`)

    return { ok: true }
}
