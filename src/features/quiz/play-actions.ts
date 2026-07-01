'use server'

import { notFound, redirect } from 'next/navigation'

import { validateUserSession } from '#services/auth/auth'
import { AnswerPayload, AnswerPayloadSchema } from '#services/quiz/quiz-schema'
import { joinSession, submitAnswer } from '#services/quiz/quiz-session-service'

/**
 * Joins the caller into the session (idempotent) and sends them to the play view. The mutation
 * lives here — triggered by the lobby "Bli med" click — so the play page itself stays a pure read.
 */
export async function joinAndEnter(sessionId: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')
    if (!(await joinSession(sessionId, user))) notFound()
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
