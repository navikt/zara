'use server'

import { redirect, unauthorized } from 'next/navigation'
import { logger } from '@navikt/next-logger'
import { revalidatePath } from 'next/cache'

import { validateUserSession } from '@services/auth/auth'
import { getFeedbackClient } from '@services/feedback/feedback-client'
import { raise } from '@lib/ts'
import { notifySlack } from '@services/slack/feedback-to-slack'

export async function deleteFeedbackPermanently(id: string): Promise<never> {
    const user = await validateUserSession()
    const client = getFeedbackClient()

    const feedback = await client.byId(id)
    if (!feedback) unauthorized()

    await client.delete(id)
    logger.info(`Feedback with id ${id} deleted by user ${user.name}`)

    revalidatePath(`/syk-inn/tilbakemeldinger`)
    redirect(`/syk-inn/tilbakemeldinger`)
}

export async function shareToSlack(id: string): Promise<void> {
    const user = await validateUserSession()
    const client = getFeedbackClient()

    const feedback = await client.byId(id)
    if (!feedback) unauthorized()

    if (feedback.verifiedContentAt == null) {
        raise('YOU SHALL NOT SHARE AN UNVERIFIED FEEDBACK TO SLACK!')
    }

    if (feedback.sharedAt) {
        raise('This feedback has already been shared to Slack!')
    }

    const slackd = await notifySlack(feedback, user)
    await client.mark.shared(id, user.name, slackd.postLink)

    logger.info(`Feedback with id ${id} shared to Slack by ${user.name}`)

    revalidatePath(`/syk-inn/tilbakemeldinger/${id}`)
}
