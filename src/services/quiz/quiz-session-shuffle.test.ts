import { randomInt } from 'node:crypto'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { gradeAnswer } from '#services/quiz/quiz-grading'
import { LiveSession, MultipleChoiceQuestionSchema, Question } from '#services/quiz/quiz-schema'
import { advanceToNextQuestion, getClientState, revealCurrentQuestion } from '#services/quiz/quiz-session-service'

const { values, vk } = vi.hoisted(() => {
    const values = new Map<string, string>()
    return {
        values,
        vk: {
            get: vi.fn<(key: string) => Promise<string | null>>(async (key) => values.get(key) ?? null),
            set: vi.fn<(key: string, value: string, options?: { conditionalSet?: string }) => Promise<string | null>>(
                async (key, value, options) => {
                    if (options?.conditionalSet === 'onlyIfDoesNotExist' && values.has(key)) return null
                    values.set(key, value)
                    return 'OK'
                },
            ),
            hgetall: vi.fn<() => Promise<{ field: string; value: string }[]>>(async () => []),
            del: vi.fn<() => Promise<number>>(async () => 0),
            expire: vi.fn<() => Promise<boolean>>(async () => true),
        },
    }
})

vi.mock('#services/db/valkey/production-valkey', () => ({ realValkey: async () => vk }))
vi.mock('#services/quiz/quiz-pubsub-client', () => ({
    publishLobbyChanged: vi.fn<() => Promise<void>>(),
    publishQuizEvent: vi.fn<() => Promise<void>>(),
}))
vi.mock('node:crypto', async (importOriginal) => ({
    ...(await importOriginal<typeof import('node:crypto')>()),
    randomInt: vi.fn<(min: number, max: number) => number>(() => 0),
}))

function question(shuffleChoices: boolean, count = 4): Question {
    return MultipleChoiceQuestionSchema.parse({
        id: 'q1',
        text: 'Question',
        type: 'multiple-choice',
        timeLimitSeconds: null,
        imageId: null,
        shuffleChoices,
        choices: Array.from({ length: count }, (_, index) => ({
            id: String(index),
            text: `Option ${index}`,
            correct: index === 0,
        })),
    })
}

function seed(questions: Question[], sessionId = 'session-1'): void {
    const session: LiveSession = {
        sessionId,
        quizId: 'quiz-1',
        quizTitle: 'Quiz',
        hostUserId: 'host',
        hostName: 'Host',
        status: 'lobby',
        currentIndex: -1,
        createdAt: Date.now(),
        playStartedAt: null,
        currentStartedAt: null,
        defaultTimeLimit: 30,
        content: { title: 'Quiz', questions },
    }
    values.set(`quiz:session:${sessionId}`, JSON.stringify(session))
}

beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
    values.clear()
})

afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
})

test.each([2, 3, 4])('shuffles %s choices once and preserves their IDs, scoring and reveal order', async (count) => {
    const original = question(true, count)
    seed([original])

    const started = await advanceToNextQuestion('session-1', 'host')
    const expectedIds = [...Array.from({ length: count - 1 }, (_, i) => String(i + 1)), '0']
    expect(started?.question).toEqual({
        id: original.id,
        text: original.text,
        type: 'multiple-choice',
        imageId: null,
        choices: expectedIds.map((id) => ({ id, text: `Option ${id}` })),
    })
    expect(randomInt).toHaveBeenCalledTimes(count - 1)
    expect(await getClientState('session-1')).toEqual(started)
    expect(await getClientState('session-1')).toEqual(started)

    const revealed = await revealCurrentQuestion('session-1')
    expect(revealed?.question).toEqual(started?.question)
    expect(revealed?.reveal?.data).toEqual({ type: 'multiple-choice', correctChoiceId: '0' })
    expect(randomInt).toHaveBeenCalledTimes(count - 1)
    expect(gradeAnswer(original, { type: 'multiple-choice', choiceId: '0' }, 0, 30_000).correct).toBe(true)
    expect(gradeAnswer(original, { type: 'multiple-choice', choiceId: '1' }, 0, 30_000).correct).toBe(false)
    expect(original).toEqual(question(true, count))

    const shuffleWrite = vk.set.mock.calls.findIndex(([key]) => key === 'quiz:session:session-1:order:0')
    const sessionWrite = vk.set.mock.calls.findIndex(([key]) => key === 'quiz:session:session-1')
    expect(shuffleWrite).toBeLessThan(sessionWrite)
})

test('disabled shuffling retains authored order without generating a shuffle', async () => {
    seed([question(false)])
    const state = await advanceToNextQuestion('session-1', 'host')
    expect(state?.question).toMatchObject({
        choices: ['0', '1', '2', '3'].map((id) => ({ id, text: `Option ${id}` })),
    })
    expect(randomInt).not.toHaveBeenCalled()
    expect(values.has('quiz:session:session-1:order:0')).toBe(false)
})

test('each enabled question and each new session gets its own shuffle', async () => {
    const questions = Array.from({ length: 10 }, (_, i) => ({ ...question(true), id: `q${i}` }))
    seed(questions)
    for (let i = 0; i < questions.length; i++) {
        await advanceToNextQuestion('session-1', 'host')
        expect(values.has(`quiz:session:session-1:order:${i}`)).toBe(true)
    }
    expect(randomInt).toHaveBeenCalledTimes(30)

    seed(questions, 'session-2')
    await advanceToNextQuestion('session-2', 'host')
    expect(values.has('quiz:session:session-2:order:0')).toBe(true)
    expect(randomInt).toHaveBeenCalledTimes(33)
})

test('an already-stored shuffle is not overwritten', async () => {
    seed([question(true)])
    values.set('quiz:session:session-1:order:0', JSON.stringify(['3', '2', '1', '0']))
    const state = await advanceToNextQuestion('session-1', 'host')
    expect(state?.question).toMatchObject({
        choices: ['3', '2', '1', '0'].map((id) => ({ id, text: `Option ${id}` })),
    })
})

test('ordering questions still shuffle their display without changing the correct order', async () => {
    seed([
        {
            id: 'q1',
            text: 'Order',
            type: 'ordering',
            timeLimitSeconds: null,
            imageId: null,
            items: ['0', '1', '2'].map((id) => ({ id, text: id })),
        },
    ])
    const started = await advanceToNextQuestion('session-1', 'host')
    expect(started?.question).toMatchObject({
        items: ['1', '2', '0'].map((id) => ({ id, text: id })),
    })
    const revealed = await revealCurrentQuestion('session-1')
    expect(revealed?.question).toEqual(started?.question)
    expect(revealed?.reveal?.data).toEqual({ type: 'ordering', correctOrder: ['0', '1', '2'] })
})
