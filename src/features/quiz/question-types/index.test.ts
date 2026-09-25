import { expect, test } from 'vitest'

import { draftToQuestion, QUESTION_TYPES, questionToDraft } from '#features/quiz/question-types'
import { MultipleChoiceQuestionSchema, QuizContentSchema } from '#services/quiz/quiz-schema'

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
