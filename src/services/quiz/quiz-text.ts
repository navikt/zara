import type { TextAnswerGroup } from '#services/quiz/quiz-schema'

/** Ignore casing and insignificant whitespace when comparing quiz answers. */
export function normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function matchTextAnswerGroups(answers: TextAnswerGroup[], texts: string[]): boolean[] {
    const submitted = new Set(texts.map(normalizeText))
    return answers.map((answer) => answer.acceptedAnswers.some((variant) => submitted.has(normalizeText(variant))))
}
