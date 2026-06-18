import { levenshtein } from '@lib/levenshtein'
import { MAX_POINTS, speedFactor } from '@services/quiz/quiz-scoring'
import { AnswerPayload, Question } from '@services/quiz/quiz-schema'

export type GradeResult = { accuracy: number; correct: boolean; points: number }

const NO_CREDIT: GradeResult = { accuracy: 0, correct: false, points: 0 }

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value))
}

/** Distance under which a text answer counts as a match, per fuzz setting. */
const FUZZ_THRESHOLD: Record<'off' | 'low' | 'medium', number> = { off: 0, low: 1, medium: 2 }

/** Trim, lowercase and collapse internal whitespace so trivial differences don't matter. */
function normalizeText(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/**
 * Grades a single answer against its question. `accuracy ∈ [0,1]` is the per-type closeness,
 * `correct` is reserved for a perfect answer (drives leaderboard correct counts), and `points`
 * scales the accuracy by a speed factor. A payload whose type doesn't match the question earns nothing.
 */
export function gradeAnswer(
    question: Question,
    answer: AnswerPayload,
    elapsedMs: number,
    limitMs: number,
): GradeResult {
    if (question.type !== answer.type) return NO_CREDIT

    let accuracy = 0
    if (question.type === 'multiple-choice' && answer.type === 'multiple-choice') {
        const selected = question.choices.find((c) => c.id === answer.choiceId)
        accuracy = selected?.correct ? 1 : 0
    } else if (question.type === 'ordering' && answer.type === 'ordering') {
        const correctIds = question.items.map((it) => it.id)
        const correctPositions = correctIds.reduce((sum, id, index) => sum + (answer.order[index] === id ? 1 : 0), 0)
        accuracy = correctIds.length > 0 ? correctPositions / correctIds.length : 0
    } else if (question.type === 'slider' && answer.type === 'slider') {
        accuracy = clamp01(1 - Math.abs(answer.value - question.correct) / question.tolerance)
    } else if (question.type === 'text' && answer.type === 'text') {
        const threshold = FUZZ_THRESHOLD[question.fuzz]
        const submitted = normalizeText(answer.text)
        const matches = question.acceptedAnswers.some(
            (accepted) => levenshtein(normalizeText(accepted), submitted) <= threshold,
        )
        accuracy = matches ? 1 : 0
    }

    const correct = accuracy === 1
    const points = Math.round(MAX_POINTS * accuracy * speedFactor(elapsedMs, limitMs))
    return { accuracy, correct, points }
}
