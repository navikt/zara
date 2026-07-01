'use server'

import { revalidatePath } from 'next/cache'

import { validateUserSession } from '#services/auth/auth'
import { DefaultTimeLimitSchema, QuizContent, QuizContentSchema } from '#services/quiz/quiz-schema'
import { createQuiz, deleteQuiz, getQuizContent, LoadContentResult, updateQuiz } from '#services/quiz/quiz-store'

export async function saveNewQuiz(
    content: QuizContent,
    defaultTimeLimit: number,
    passphrase: string,
): Promise<{ id: string }> {
    const user = await validateUserSession('TEAM_MEMBER')
    const parsed = QuizContentSchema.parse(content)
    const limit = DefaultTimeLimitSchema.parse(defaultTimeLimit)

    const id = await createQuiz(user.userId, parsed, limit, passphrase)
    revalidatePath('/quiz')

    return { id }
}

export async function saveExistingQuiz(
    id: string,
    content: QuizContent,
    defaultTimeLimit: number,
    passphrase: string,
): Promise<{ ok: boolean }> {
    const user = await validateUserSession('TEAM_MEMBER')
    const parsed = QuizContentSchema.parse(content)
    const limit = DefaultTimeLimitSchema.parse(defaultTimeLimit)

    const ok = await updateQuiz(id, user.userId, parsed, limit, passphrase)
    revalidatePath('/quiz')

    return { ok }
}

export async function removeQuiz(id: string): Promise<void> {
    const user = await validateUserSession('TEAM_MEMBER')

    await deleteQuiz(id, user.userId)
    revalidatePath('/quiz')
}

/** Loads a quiz's content into the builder, decrypting with the owner's passphrase when needed. */
export async function loadQuizForEdit(quizId: string, passphrase: string | null): Promise<LoadContentResult> {
    const user = await validateUserSession('TEAM_MEMBER')
    return getQuizContent(quizId, user.userId, passphrase)
}
