import { test, expect } from 'vitest'

import { levenshtein } from '#lib/levenshtein'
import { gradeAnswer } from '#services/quiz/quiz-grading'
import {
    MultipleChoiceQuestion,
    MultiTextQuestion,
    OrderingQuestion,
    SliderQuestion,
    TextQuestion,
} from '#services/quiz/quiz-schema'
import { MAX_POINTS } from '#services/quiz/quiz-scoring'

const base = { id: 'q1', text: 'Spørsmål', timeLimitSeconds: null, imageId: null }

const mc: MultipleChoiceQuestion = {
    ...base,
    type: 'multiple-choice',
    shuffleChoices: false,
    choices: [
        { id: 'a', text: 'A', correct: false },
        { id: 'b', text: 'B', correct: true },
    ],
}

const ordering: OrderingQuestion = {
    ...base,
    type: 'ordering',
    items: [
        { id: 'i1', text: 'En' },
        { id: 'i2', text: 'To' },
        { id: 'i3', text: 'Tre' },
    ],
}

const slider: SliderQuestion = { ...base, type: 'slider', min: 0, max: 100, step: 1, correct: 50, tolerance: 10 }

const text: TextQuestion = { ...base, type: 'text', acceptedAnswers: ['Oslo'], fuzz: 'low' }
const multiText: MultiTextQuestion = {
    ...base,
    type: 'multi-text',
    correctAnswers: [{ acceptedAnswers: ['Australia'] }, { acceptedAnswers: ['France'] }],
}

/* ───────────────────────────── levenshtein ───────────────────────────── */

test('levenshtein measures edit distance', () => {
    expect(levenshtein('', '')).toBe(0)
    expect(levenshtein('abc', 'abc')).toBe(0)
    expect(levenshtein('abc', 'abd')).toBe(1)
    expect(levenshtein('kitten', 'sitting')).toBe(3)
    expect(levenshtein('', 'abc')).toBe(3)
})

/* ───────────────────────────── multiple choice ───────────────────────────── */

test('multiple-choice: correct answer earns full accuracy and the wrong one earns nothing', () => {
    const right = gradeAnswer(mc, { type: 'multiple-choice', choiceId: 'b' }, 0, 20_000)
    expect(right).toEqual({ accuracy: 1, correct: true, points: MAX_POINTS })

    const wrong = gradeAnswer(mc, { type: 'multiple-choice', choiceId: 'a' }, 0, 20_000)
    expect(wrong).toEqual({ accuracy: 0, correct: false, points: 0 })
})

/* ───────────────────────────── ordering ───────────────────────────── */

test('ordering: accuracy is the fraction of items in the correct absolute position', () => {
    const perfect = gradeAnswer(ordering, { type: 'ordering', order: ['i1', 'i2', 'i3'] }, 0, 20_000)
    expect(perfect.accuracy).toBe(1)
    expect(perfect.correct).toBe(true)

    // First item right, last two swapped -> 1/3.
    const partial = gradeAnswer(ordering, { type: 'ordering', order: ['i1', 'i3', 'i2'] }, 0, 20_000)
    expect(partial.accuracy).toBeCloseTo(1 / 3)
    expect(partial.correct).toBe(false)
    expect(partial.points).toBe(Math.round(MAX_POINTS * (1 / 3)))
})

/* ───────────────────────────── slider ───────────────────────────── */

test('slider: accuracy by closeness within tolerance', () => {
    expect(gradeAnswer(slider, { type: 'slider', value: 50 }, 0, 20_000).accuracy).toBe(1)
    // 5 away with tolerance 10 -> 0.5
    expect(gradeAnswer(slider, { type: 'slider', value: 55 }, 0, 20_000).accuracy).toBeCloseTo(0.5)
    // 20 away -> clamped to 0
    expect(gradeAnswer(slider, { type: 'slider', value: 70 }, 0, 20_000).accuracy).toBe(0)
})

/* ───────────────────────────── text ───────────────────────────── */

test('text: exact match earns full credit (case/whitespace insensitive)', () => {
    expect(gradeAnswer(text, { type: 'text', text: '  oslo ' }, 0, 20_000).accuracy).toBe(1)
})

test('text: a typo within the fuzz threshold still matches', () => {
    // "Oslp" is distance 1 from "Oslo"; fuzz 'low' allows 1.
    expect(gradeAnswer(text, { type: 'text', text: 'Oslp' }, 0, 20_000).accuracy).toBe(1)
})

test('text: a typo beyond the fuzz threshold does not match', () => {
    const offFuzz: TextQuestion = { ...text, fuzz: 'off' }
    expect(gradeAnswer(offFuzz, { type: 'text', text: 'Oslp' }, 0, 20_000).accuracy).toBe(0)
    // Distance 2 with fuzz 'low' (threshold 1) misses.
    expect(gradeAnswer(text, { type: 'text', text: 'Oxxo' }, 0, 20_000).accuracy).toBe(0)

    const mediumFuzz: TextQuestion = { ...text, fuzz: 'medium' }
    expect(gradeAnswer(mediumFuzz, { type: 'text', text: 'Oslox' }, 0, 20_000).accuracy).toBe(1)
})

/* ───────────────────────────── points & speed & mismatch ───────────────────────────── */

test.each([0, 10_000, 20_000])(
    'multi-text gives equal partial credit regardless of elapsed time (%s ms)',
    (elapsed) => {
        expect(gradeAnswer(multiText, { type: 'multi-text', texts: ['France', 'Spain'] }, elapsed, 20_000)).toEqual({
            accuracy: 0.5,
            correct: false,
            points: 500,
        })
        expect(
            gradeAnswer(multiText, { type: 'multi-text', texts: [' FRANCE ', 'australia'] }, elapsed, 20_000),
        ).toEqual({
            accuracy: 1,
            correct: true,
            points: 1000,
        })
    },
)

test('multi-text counts repeated guesses only once and ignores empty and incorrect guesses', () => {
    expect(gradeAnswer(multiText, { type: 'multi-text', texts: ['France', ' france '] }, 0, 20_000).points).toBe(500)
    expect(gradeAnswer(multiText, { type: 'multi-text', texts: ['France', ''] }, 0, 20_000).points).toBe(500)
    for (const texts of [[], ['', '  '], ['Spain', 'Germany']]) {
        expect(gradeAnswer(multiText, { type: 'multi-text', texts }, 0, 20_000)).toEqual({
            accuracy: 0,
            correct: false,
            points: 0,
        })
    }
})

test('multi-text normalizes whitespace but does not award credit for misspellings', () => {
    const question: MultiTextQuestion = {
        ...multiText,
        correctAnswers: [{ acceptedAnswers: ['New Zealand'] }, { acceptedAnswers: ['France'] }],
    }
    expect(gradeAnswer(question, { type: 'multi-text', texts: [' new   ZEALAND ', 'Frnce'] }, 0, 20_000).points).toBe(
        500,
    )
})

test('multi-text awards 500 points for five of ten answers and rounds only the final total', () => {
    const correctAnswers = Array.from({ length: 10 }, (_, index) => `Answer ${index + 1}`)
    expect(
        gradeAnswer(
            { ...multiText, correctAnswers: correctAnswers.map((answer) => ({ acceptedAnswers: [answer] })) },
            { type: 'multi-text', texts: correctAnswers.slice(0, 5) },
            20_000,
            20_000,
        ).points,
    ).toBe(500)

    const thirds: MultiTextQuestion = {
        ...multiText,
        correctAnswers: ['France', 'Australia', 'Norway'].map((answer) => ({ acceptedAnswers: [answer] })),
    }
    expect(gradeAnswer(thirds, { type: 'multi-text', texts: ['France', 'Norway'] }, 20_000, 20_000).points).toBe(667)
    expect(
        gradeAnswer(thirds, { type: 'multi-text', texts: ['France', 'Australia', 'Norway'] }, 20_000, 20_000).points,
    ).toBe(1000)
})

test.each(['Frankrike', 'France', ' france '])(
    'multi-text accepts the spelling "%s" for the same answer',
    (variant) => {
        const question: MultiTextQuestion = {
            ...multiText,
            correctAnswers: [{ acceptedAnswers: ['Australia'] }, { acceptedAnswers: ['Frankrike', 'France'] }],
        }
        expect(gradeAnswer(question, { type: 'multi-text', texts: [variant, 'Australia'] }, 20_000, 20_000)).toEqual({
            accuracy: 1,
            correct: true,
            points: 1000,
        })
    },
)

test('multi-text awards only one share of points when two spellings of the same answer are submitted', () => {
    const question: MultiTextQuestion = {
        ...multiText,
        correctAnswers: [{ acceptedAnswers: ['Australia'] }, { acceptedAnswers: ['Frankrike', 'France'] }],
    }
    expect(gradeAnswer(question, { type: 'multi-text', texts: ['Frankrike', 'France'] }, 20_000, 20_000)).toEqual({
        accuracy: 0.5,
        correct: false,
        points: 500,
    })
})

test('ordinary text questions still accept alternatives and retain speed-based scoring', () => {
    const question: TextQuestion = { ...text, acceptedAnswers: ['Oslo', 'Christiania'] }
    expect(gradeAnswer(question, { type: 'text', text: 'Christiania' }, 20_000, 20_000)).toEqual({
        accuracy: 1,
        correct: true,
        points: 500,
    })
    expect(gradeAnswer(multiText, { type: 'text', text: 'France' }, 0, 20_000).points).toBe(0)
})

test('points scale a perfect answer by the speed factor', () => {
    // Halfway through the limit -> speedFactor 0.75.
    expect(gradeAnswer(mc, { type: 'multiple-choice', choiceId: 'b' }, 10_000, 20_000).points).toBe(
        Math.round(MAX_POINTS * 0.75),
    )
    // At the buzzer -> 0.5.
    expect(gradeAnswer(mc, { type: 'multiple-choice', choiceId: 'b' }, 20_000, 20_000).points).toBe(
        Math.round(MAX_POINTS * 0.5),
    )
})

test('a payload whose type does not match the question earns nothing', () => {
    expect(gradeAnswer(mc, { type: 'slider', value: 50 }, 0, 20_000)).toEqual({
        accuracy: 0,
        correct: false,
        points: 0,
    })
})
