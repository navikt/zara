'use server'

import { revalidatePath } from 'next/cache'

import { validateUserSession } from '#services/auth/auth'
import { DefaultTimeLimitSchema, QuizContent, QuizContentSchema } from '#services/quiz/quiz-schema'
import {
    createQuiz,
    deleteQuiz,
    getPlayableQuizContent,
    getQuizContent,
    LoadContentResult,
    updateQuiz,
} from '#services/quiz/quiz-store'

export async function saveNewQuiz(content: QuizContent, defaultTimeLimit: number): Promise<{ id: string }> {
    const user = await validateUserSession('TEAM_MEMBER')
    const parsed = QuizContentSchema.parse(content)
    const limit = DefaultTimeLimitSchema.parse(defaultTimeLimit)

    const id = await createQuiz(user.userId, parsed, limit)
    revalidatePath('/quiz')

    return { id }
}

/** Fails (`ok: false`) when the quiz has been played — shared quizzes are immutable. */
export async function saveExistingQuiz(
    id: string,
    content: QuizContent,
    defaultTimeLimit: number,
): Promise<{ ok: boolean }> {
    const user = await validateUserSession('TEAM_MEMBER')
    const parsed = QuizContentSchema.parse(content)
    const limit = DefaultTimeLimitSchema.parse(defaultTimeLimit)

    const ok = await updateQuiz(id, user.userId, parsed, limit)
    revalidatePath('/quiz')

    return { ok }
}

export async function removeQuiz(id: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')

    await deleteQuiz(id, user.userId)
    revalidatePath('/quiz')
}

/**
 * Loads a quiz's content into the builder. Legacy passphrase-encrypted quizzes need the owner's
 * passphrase; everything else decrypts with the app secret.
 */
export async function loadQuizForEdit(quizId: string, passphrase: string | null): Promise<LoadContentResult> {
    const user = await validateUserSession('TEAM_MEMBER')
    return getQuizContent(quizId, user.userId, passphrase)
}

/** Loads content to seed a copy — works for the caller's own quizzes and any shared (played) quiz. */
export async function loadQuizForDuplicate(quizId: string): Promise<LoadContentResult> {
    const user = await validateUserSession('TEAM_MEMBER')
    return getPlayableQuizContent(quizId, user.userId, null)
}
