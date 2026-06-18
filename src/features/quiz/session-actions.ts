'use server'

import { after } from 'next/server'
import { logger } from '@navikt/next-logger'

import { validateUserSession } from '@services/auth/auth'
import { getQuizContent, openQuizAfterSession, saveSessionStats } from '@services/quiz/quiz-store'
import {
    advanceToNextQuestion,
    cancelSession,
    createSession,
    endSession,
    revealQuestion,
} from '@services/quiz/quiz-session-service'

export async function hostStartSession(
    quizId: string,
    passphrase: string | null,
): Promise<{ sessionId: string } | { error: string }> {
    const user = await validateUserSession('TEAM_MEMBER')

    const loaded = await getQuizContent(quizId, user.userId, passphrase)
    if (!loaded.ok) {
        return { error: loaded.reason === 'wrong-passphrase' ? 'Feil passordfrase.' : 'Fant ikke quizen.' }
    }

    const session = await createSession(
        {
            id: quizId,
            title: loaded.content.title,
            content: loaded.content,
            defaultTimeLimit: loaded.defaultTimeLimit,
        },
        user,
    )

    return { sessionId: session.sessionId }
}

export async function hostNextQuestion(sessionId: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')
    await advanceToNextQuestion(sessionId, user.userId)
}

export async function hostRevealQuestion(sessionId: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')
    await revealQuestion(sessionId, user.userId)
}

/** Close a not-yet-played session (lobby) without recording a stats run. */
export async function hostCancelSession(sessionId: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')
    await cancelSession(sessionId, user.userId)
}

export async function hostEndSession(sessionId: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')

    const result = await endSession(sessionId, user.userId)
    if (!result) return

    // Persist stats and "open" the quiz to plaintext after responding (requirements 6 & 7).
    after(async () => {
        try {
            await saveSessionStats(result)
            await openQuizAfterSession(result.quizId, result.content)
        } catch (e) {
            logger.error(new Error(`Failed post-session work for quiz ${result.quizId}`, { cause: e }))
        }
    })
}
