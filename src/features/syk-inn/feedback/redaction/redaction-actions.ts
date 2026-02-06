'use server'

import { unauthorized } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { logger } from '@navikt/next-logger'

import { getFeedbackClient } from '@services/feedback/feedback-client'
import { validateUserSession } from '@services/auth/auth'

import { feedbackToWordsByLines } from '../utils'

export async function redactFeedbackContent(
    id: string,
    redactLocations: [number, number][],
): Promise<{ redacted: boolean }> {
    const user = await validateUserSession()
    const [client] = getFeedbackClient()
    const feedback = await client.byId(id)
    if (!feedback) unauthorized()

    const lookup = new Set(redactLocations.map(([line, word]) => `${line}:${word}`))
    const wordsByLines = feedbackToWordsByLines(feedback.message)
    const rebuilt = wordsByLines
        .map((words, lineIndex) =>
            words.map((word, wordIndex) => (lookup.has(`${lineIndex}:${wordIndex}`) ? '<redacted>' : word)).join(' '),
        )
        .join('\n')

    await client.updateFeedback(id, rebuilt, { name: user.name, count: redactLocations.length })
    revalidatePath(`/syk-inn/tilbakemeldinger/${id}`)

    logger.info(`Updated feedback ${id} by redacting ${redactLocations.length} words`)

    return { redacted: true }
}
