'use server'

import { logger } from '@navikt/next-logger'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'

import { validateUserSession } from '#services/auth/auth'
import {
    advanceToNextQuestion,
    cancelSession,
    createSession,
    endSession,
    revealNextPlace,
    revealQuestion,
} from '#services/quiz/quiz-session-service'
import { getPlayableQuizContent, markQuizPlayed, saveSessionStats } from '#services/quiz/quiz-store'

/**
 * Starts a session for a quiz the caller owns, or any quiz the team has already played (shared).
 * `passphrase` is only ever needed for the caller's own LEGACY passphrase-encrypted quizzes.
 */
export async function hostStartSession(
    quizId: string,
    passphrase: string | null,
): Promise<{ sessionId: string } | { error: string }> {
    const user = await validateUserSession('TEAM_MEMBER')

    const loaded = await getPlayableQuizContent(quizId, user.userId, passphrase)
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

/** Unmask the next place in the finished quiz's podium ceremony (3rd → 2nd → 1st → everyone). */
export async function hostRevealNextPlace(sessionId: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')
    await revealNextPlace(sessionId, user.userId)
}

export async function hostEndSession(sessionId: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')

    const result = await endSession(sessionId, user.userId)
    if (!result) return

    // Persist stats and share the quiz with the team after responding (requirements 6 & 7).
    after(async () => {
        try {
            await saveSessionStats(result)
            await markQuizPlayed(result.quizId, result.content)
            revalidatePath('/quiz')
        } catch (e) {
            logger.error(new Error(`Failed post-session work for quiz ${result.quizId}`, { cause: e }))
        }
    })
}
