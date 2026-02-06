'use server'

import { redirect, unauthorized } from 'next/navigation'
import { logger } from '@navikt/next-logger'
import { revalidatePath } from 'next/cache'

import { validateUserSession } from '@services/auth/auth'
import { getFeedbackClient } from '@services/feedback/feedback-client'

export async function deleteFeedbackPermanently(id: string): Promise<never> {
    const user = await validateUserSession()
    const [client] = getFeedbackClient()

    const feedback = await client.byId(id)
    if (!feedback) unauthorized()

    await client.delete(id)
    logger.info(`Feedback with id ${id} deleted by user ${user.name}`)

    revalidatePath(`/syk-inn/tilbakemeldinger`)
    redirect(`/syk-inn/tilbakemeldinger`)
}
