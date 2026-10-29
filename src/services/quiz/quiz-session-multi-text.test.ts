import { afterEach, beforeEach, expect, test, vi } from 'vitest'

import { User } from '#services/auth/user'
import { LiveSession } from '#services/quiz/quiz-schema'
import { getSession, submitAnswer } from '#services/quiz/quiz-session-service'

const { vk } = vi.hoisted(() => ({
    vk: {
        get: vi.fn<() => Promise<string | null>>(),
        hexists: vi.fn<() => Promise<boolean>>(),
        hset: vi.fn<(key: string, values: Record<string, string>) => Promise<number>>(),
        hkeys: vi.fn<() => Promise<string[]>>(),
        hgetall: vi.fn<() => Promise<{ field: string; value: string }[]>>(),
        expire: vi.fn<() => Promise<boolean>>(),
    },
}))

vi.mock('#services/db/valkey/production-valkey', () => ({ realValkey: async () => vk }))
vi.mock('#services/quiz/quiz-pubsub-client', () => ({
    publishQuizEvent: vi.fn<() => Promise<void>>(),
}))

const user: User = { userId: 'player', name: 'Player', oid: 'oid', navIdent: null, groups: [] }
const session: LiveSession = {
    sessionId: 'multi-session',
    quizId: 'quiz',
    quizTitle: 'Countries',
    hostUserId: 'host',
    hostName: 'Host',
    status: 'question',
    currentIndex: 0,
    createdAt: 1_000,
    playStartedAt: 2_000,
    currentStartedAt: 2_000,
    defaultTimeLimit: 30,
    content: {
        title: 'Countries',
        questions: [
            {
                id: 'q1',
                text: 'Name the countries',
                type: 'multi-text',
                correctAnswers: [{ acceptedAnswers: ['Australia'] }, { acceptedAnswers: ['Frankrike', 'France'] }],
                timeLimitSeconds: null,
                imageId: null,
            },
        ],
    },
}

beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(32_000)
    vi.resetAllMocks()
    vk.get.mockResolvedValue(JSON.stringify(session))
    vk.hexists.mockResolvedValue(false)
    vk.hset.mockResolvedValue(1)
    vk.hkeys.mockResolvedValue([])
    vk.hgetall.mockResolvedValue([])
    vk.expire.mockResolvedValue(true)
})

afterEach(() => {
    vi.useRealTimers()
})

test('multi-text stores partial credit at the deadline without a speed penalty', async () => {
    const answer = { type: 'multi-text' as const, texts: ['France', 'Frankrike'] }
    expect(await submitAnswer(session.sessionId, user, answer)).toEqual({ ok: true })
    expect(vk.hset).toHaveBeenCalledWith('quiz:session:multi-session:answers:0', {
        player: JSON.stringify({ answer, answeredAt: 32_000, accuracy: 0.5, correct: false, points: 500 }),
    })
})

test('live multi-text sessions with the original string answers remain playable', async () => {
    const legacy = {
        ...session,
        content: {
            ...session.content,
            questions: [{ ...session.content.questions[0], correctAnswers: ['Australia', 'France'] }],
        },
    }
    vk.get.mockResolvedValue(JSON.stringify(legacy))
    expect((await getSession(session.sessionId))?.content.questions[0]).toMatchObject({
        correctAnswers: [{ acceptedAnswers: ['Australia'] }, { acceptedAnswers: ['France'] }],
    })
    const answer = { type: 'multi-text' as const, texts: ['France', ''] }
    expect(await submitAnswer(session.sessionId, user, answer)).toEqual({ ok: true })
    expect(vk.hset).toHaveBeenCalledWith('quiz:session:multi-session:answers:0', {
        player: JSON.stringify({ answer, answeredAt: 32_000, accuracy: 0.5, correct: false, points: 500 }),
    })
})

test.each(
    [
        ['France', 'Australia', 'Norway'],
        ['France', 'x'.repeat(501)],
    ].map((texts) => ({ texts })),
)('multi-text rejects excessive guesses or oversized answers: $texts', async ({ texts }) => {
    expect(await submitAnswer(session.sessionId, user, { type: 'multi-text', texts })).toEqual({
        ok: false,
        reason: 'invalid-answer',
    })
    expect(vk.hset).not.toHaveBeenCalled()
})

test('multi-text still rejects answers after the deadline and network grace', async () => {
    vi.setSystemTime(34_000)
    expect(await submitAnswer(session.sessionId, user, { type: 'multi-text', texts: ['France'] })).toEqual({
        ok: false,
        reason: 'locked',
    })
    expect(vk.hset).not.toHaveBeenCalled()
})
