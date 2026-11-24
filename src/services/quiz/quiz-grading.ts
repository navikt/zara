import { levenshtein } from '#lib/levenshtein'
import { AnswerPayload, MajorityQuestion, Question } from '#services/quiz/quiz-schema'
import { MAX_POINTS, speedFactor } from '#services/quiz/quiz-scoring'
import { matchTextAnswerGroups, normalizeText } from '#services/quiz/quiz-text'

export type GradeResult = { accuracy: number; correct: boolean; points: number }

const NO_CREDIT: GradeResult = { accuracy: 0, correct: false, points: 0 }

function clamp01(value: number): number {
    return Math.min(1, Math.max(0, value))
}

/** Distance under which a text answer counts as a match, per fuzz setting. */
const FUZZ_THRESHOLD: Record<'off' | 'low' | 'medium', number> = { off: 0, low: 1, medium: 2 }

/**
 * Grades a single answer against its question. `accuracy ∈ [0,1]` is the per-type closeness,
 * `correct` is reserved for a perfect answer (drives leaderboard correct counts), and `points`
 * scales the accuracy by a speed factor, except for multi-text questions.
 * A payload whose type doesn't match the question earns nothing.
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
    } else if (question.type === 'multi-text' && answer.type === 'multi-text') {
        const matches = matchTextAnswerGroups(question.correctAnswers, answer.texts).filter(Boolean).length
        accuracy = matches / question.correctAnswers.length
    } else if (question.type === 'majority' && answer.type === 'majority') {
        // Provisional: a majority answer can only be scored once everyone has voted.
        // The real grade is computed at reveal by `gradeMajorityAnswers`.
        return NO_CREDIT
    }

    const correct = accuracy === 1
    const multiplier = question.type === 'multi-text' ? 1 : speedFactor(elapsedMs, limitMs)
    const points = Math.round(MAX_POINTS * accuracy * multiplier)
    return { accuracy, correct, points }
}

/** Votes per option id, counting only answers to a known option. */
export function tallyMajorityVotes(question: MajorityQuestion, answers: AnswerPayload[]): Map<string, number> {
    const tally = new Map<string, number>(question.options.map((option) => [option.id, 0]))
    for (const answer of answers) {
        if (answer.type !== 'majority') continue
        const count = tally.get(answer.optionId)
        if (count != null) tally.set(answer.optionId, count + 1)
    }
    return tally
}

/** The most-voted option id(s). Ties share the crown; empty when nobody voted. */
export function majorityWinners(question: MajorityQuestion, answers: AnswerPayload[]): string[] {
    const tally = tallyMajorityVotes(question, answers)
    const top = Math.max(0, ...tally.values())
    if (top === 0) return []
    return [...tally].filter(([, count]) => count === top).map(([id]) => id)
}

/**
 * Grades every answer to a "Gjett flertallet" question against the crowd. Accuracy is the share of
 * your option's votes relative to the winning option's: backing the (joint) favourite is "correct"
 * and scores fully, a runner-up with half as many votes earns half, and so on. Speed still counts.
 * Results are returned in the same order as `answers`.
 */
export function gradeMajorityAnswers(
    question: MajorityQuestion,
    answers: { answer: AnswerPayload; elapsedMs: number }[],
    limitMs: number,
): GradeResult[] {
    const tally = tallyMajorityVotes(
        question,
        answers.map((entry) => entry.answer),
    )
    const top = Math.max(0, ...tally.values())
    return answers.map(({ answer, elapsedMs }) => {
        if (answer.type !== 'majority' || top === 0) return NO_CREDIT
        const accuracy = clamp01((tally.get(answer.optionId) ?? 0) / top)
        const correct = accuracy === 1
        const points = Math.round(MAX_POINTS * accuracy * speedFactor(elapsedMs, limitMs))
        return { accuracy, correct, points }
    })
}
