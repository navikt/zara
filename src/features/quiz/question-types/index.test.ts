import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { expect, test } from 'vitest'

import { draftToQuestion, QUESTION_TYPES, questionToDraft } from '#features/quiz/question-types'
import MultiTextEditor from '#features/quiz/question-types/multi-text/Editor'
import MultiTextPlayInput from '#features/quiz/question-types/multi-text/PlayInput'
import MultiTextReveal from '#features/quiz/question-types/multi-text/Reveal'
import {
    AnswerPayloadSchema,
    MultipleChoiceQuestionSchema,
    MultiTextQuestionSchema,
    QuizContentSchema,
} from '#services/quiz/quiz-schema'

const base = { id: 'q1', text: 'Question', timeLimitSeconds: null, imageId: null }
const legacyQuestion = {
    ...base,
    type: 'multiple-choice',
    choices: [
        { id: 'a', text: 'Correct', correct: true },
        { id: 'b', text: 'Wrong', correct: false },
    ],
}

test('new multiple-choice drafts enable shuffling by default', () => {
    expect(QUESTION_TYPES['multiple-choice'].blankDraft(base)).toMatchObject({ shuffleChoices: true })
})

test('existing questions without a shuffle setting retain their original order', () => {
    const question = MultipleChoiceQuestionSchema.parse(legacyQuestion)
    expect(question.shuffleChoices).toBe(false)
    expect(questionToDraft(question)).toMatchObject({ shuffleChoices: false })
})

test.each([true, false])('shuffleChoices=%s survives saving, loading, editing and copying', (shuffleChoices) => {
    const question = MultipleChoiceQuestionSchema.parse({ ...legacyQuestion, shuffleChoices })
    const draft = questionToDraft(question)
    expect(draft).toMatchObject({ shuffleChoices })

    const saved = QuizContentSchema.parse({ title: 'Quiz', questions: [draftToQuestion(draft)] })
    const loaded = QuizContentSchema.parse(JSON.parse(JSON.stringify(saved)))
    expect(loaded.questions[0]).toEqual(question)
    expect(questionToDraft(loaded.questions[0])).toEqual(draft)
})

test('the shuffle setting must be a boolean', () => {
    expect(MultipleChoiceQuestionSchema.safeParse({ ...legacyQuestion, shuffleChoices: 'true' }).success).toBe(false)
})

test('multi-text answer groups and spellings survive saving, loading, editing and copying', () => {
    const question = MultiTextQuestionSchema.parse({
        ...base,
        type: 'multi-text',
        correctAnswers: [{ acceptedAnswers: ['Australia'] }, { acceptedAnswers: ['Frankrike', 'France'] }],
    })
    const draft = questionToDraft(question)
    const saved = QuizContentSchema.parse({ title: 'Quiz', questions: [draftToQuestion(draft)] })
    const loaded = QuizContentSchema.parse(JSON.parse(JSON.stringify(saved)))
    expect(loaded.questions[0]).toEqual(question)
    expect(questionToDraft(loaded.questions[0])).toEqual(draft)
    if (draft.type !== 'multi-text') throw new Error('Expected multi-text draft')
    draft.correctAnswers[1].acceptedAnswers[0] = 'Norway'
    expect(question.correctAnswers).toEqual([
        { acceptedAnswers: ['Australia'] },
        { acceptedAnswers: ['Frankrike', 'France'] },
    ])
    expect(saved.questions[0]).toEqual(question)
})

test('older multi-text questions load each original string as a separate answer group', () => {
    const question = MultiTextQuestionSchema.parse({
        ...base,
        type: 'multi-text',
        correctAnswers: ['Australia', 'France'],
    })
    expect(question.correctAnswers).toEqual([{ acceptedAnswers: ['Australia'] }, { acceptedAnswers: ['France'] }])
})

test.each(
    [
        [],
        ['Australia'],
        ['Australia', ' '],
        ['France', ' france '],
        ['New Zealand', 'new   zealand'],
        ['France', 'x'.repeat(501)],
        Array.from({ length: 11 }, (_, i) => `Answer ${i}`),
        [{ acceptedAnswers: [] }, { acceptedAnswers: ['France'] }],
        [{ acceptedAnswers: ['Australia', ' '] }, { acceptedAnswers: ['France'] }],
        [{ acceptedAnswers: ['Australia', ' AUSTRALIA '] }, { acceptedAnswers: ['France'] }],
        [{ acceptedAnswers: ['France'] }, { acceptedAnswers: ['Frankrike', ' france '] }],
        [{ acceptedAnswers: ['New Zealand'] }, { acceptedAnswers: ['NZ', 'new   zealand'] }],
        [{ acceptedAnswers: ['Australia', 'x'.repeat(501)] }, { acceptedAnswers: ['France'] }],
        [{ acceptedAnswers: Array.from({ length: 11 }, (_, i) => `Spelling ${i}`) }, { acceptedAnswers: ['France'] }],
    ].map((correctAnswers) => ({ correctAnswers })),
)('multi-text rejects invalid or duplicate correct answers: $correctAnswers', ({ correctAnswers }) => {
    expect(MultiTextQuestionSchema.safeParse({ ...base, type: 'multi-text', correctAnswers }).success).toBe(false)
})

test('multi-text payloads allow partial answers but limit count, length and shape', () => {
    expect(AnswerPayloadSchema.safeParse({ type: 'multi-text', texts: ['France', ''] }).success).toBe(true)
    for (const texts of [Array(11).fill('France'), ['x'.repeat(501)], 'France', [42]]) {
        expect(AnswerPayloadSchema.safeParse({ type: 'multi-text', texts }).success).toBe(false)
    }
})

test('multi-text renders one labeled field per expected answer without revealing the answers', () => {
    const html = renderToStaticMarkup(
        createElement(MultiTextPlayInput, {
            question: { ...base, type: 'multi-text', answerCount: 2 },
            onAnswer: () => {},
            disabled: false,
        }),
    )
    expect(html.match(/<input\b/g)).toHaveLength(2)
    expect(html).toContain('Skriv 2 ulike svar')
    expect(html).toContain('Svar 1 av 2')
    expect(html).toContain('Svar 2 av 2')
    expect(html).toContain('Ingen tidsbonus')
    expect(html).not.toContain('Australia')
    expect(html).not.toContain('France')
})

test('multi-text reveal explains partial credit without counting duplicate answers twice', () => {
    const html = renderToStaticMarkup(
        createElement(MultiTextReveal, {
            question: { ...base, type: 'multi-text', answerCount: 2 },
            data: {
                type: 'multi-text',
                correctAnswers: [{ acceptedAnswers: ['Australia'] }, { acceptedAnswers: ['Frankrike', 'France'] }],
            },
            results: [],
            myResult: {
                playerId: 'player',
                answer: { type: 'multi-text', texts: ['France', 'Frankrike'] },
                accuracy: 0.5,
                correct: false,
                points: 500,
            },
        }),
    )
    expect(html).toContain('Du fant 1 av 2 riktige svar.')
    expect(html).toContain('Australia – manglet')
    expect(html).toContain('Frankrike / France – riktig')
})

test('multi-text editor groups alternative spellings under the same answer', () => {
    const html = renderToStaticMarkup(
        createElement(MultiTextEditor, {
            draft: {
                ...base,
                type: 'multi-text',
                correctAnswers: [{ acceptedAnswers: ['Australia'] }, { acceptedAnswers: ['Frankrike', 'France'] }],
            },
            onChange: () => {},
        }),
    )
    expect(html.match(/<fieldset\b/g)).toHaveLength(2)
    expect(html.match(/<input\b/g)).toHaveLength(3)
    expect(html).toContain('Fasitsvar 2')
    expect(html).not.toContain('Fasitsvar 3')
    expect(html).toContain('value="Frankrike"')
    expect(html).toContain('value="France"')
    expect(html).toContain('Legg til skrivemåte for fasitsvar 2')
})
