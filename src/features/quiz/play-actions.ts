'use server'

import { redirect } from 'next/navigation'

import { validateUserSession } from '#services/auth/auth'
import { AliasSchema, AnswerPayload, AnswerPayloadSchema } from '#services/quiz/quiz-schema'
import { joinSession, submitAnswer } from '#services/quiz/quiz-session-service'

/**
 * Joins the caller into the session under the alias they picked and sends them to the play view.
 * Returns an error instead of throwing so the join form can render it inline; on success this
 * redirects, and the caller observes `undefined` once the router has navigated.
 */
export async function joinWithAlias(sessionId: string, alias: string): Promise<{ error: string } | undefined> {
    const user = await validateUserSession('TEAM_MEMBER')

    const parsed = AliasSchema.safeParse(alias)
    if (!parsed.success) return { error: parsed.error.issues[0].message }

    const joined = await joinSession(sessionId, user, parsed.data)
    if (!joined.ok) {
        switch (joined.reason) {
            case 'alias-taken':
                return { error: 'Kallenavnet er allerede tatt i denne quizen. Velg et annet.' }
            case 'ended':
                return { error: 'Denne quizen er ferdig, så det er for sent å bli med.' }
            case 'no-session':
                return { error: 'Fant ikke quiz-sesjonen. Den kan ha blitt avsluttet.' }
        }
    }

    redirect(`/quiz/play/${sessionId}`)
}

export async function answerQuestion(
    sessionId: string,
    answer: AnswerPayload,
): Promise<{ ok: true } | { ok: false; reason: string }> {
    const user = await validateUserSession('TEAM_MEMBER')
    const parsed = AnswerPayloadSchema.parse(answer)
    return submitAnswer(sessionId, user, parsed)
}
