import { logger } from '@navikt/next-logger'
import { randomInt, randomUUID } from 'node:crypto'

import { User } from '#services/auth/user'
import { valkeyClient } from '#services/db/valkey/production-valkey'
import { gradeAnswer } from '#services/quiz/quiz-grading'
import { publishLobbyChanged, publishQuizEvent } from '#services/quiz/quiz-pubsub-client'
import {
    ActiveSession,
    AnswerPayload,
    ClientSessionState,
    LeaderboardEntry,
    LiveSession,
    PlayerPresence,
    PublicQuestion,
    Question,
    QuizContent,
    RevealData,
    RevealResult,
} from '#services/quiz/quiz-schema'
import { averagePercent, buildLeaderboard, PlayerScore } from '#services/quiz/quiz-scoring'
import { SessionStatsInput } from '#services/quiz/quiz-store'

const TTL = 6 * 60 * 60
const ENDED_TTL = 30 * 60
/** Grace window for network latency when checking whether an answer arrived in time. */
const ANSWER_GRACE_MS = 1500
const ACTIVE_SESSIONS_KEY = 'quiz:active-sessions'

const sessionKey = (id: string): string => `quiz:session:${id}`
const playersKey = (id: string): string => `quiz:session:${id}:players`
const answersKey = (id: string, index: number): string => `quiz:session:${id}:answers:${index}`
const scoresKey = (id: string): string => `quiz:session:${id}:scores`
const correctKey = (id: string): string => `quiz:session:${id}:correct`
/** The once-computed shuffled display order (item ids) for an ordering question at `index`. */
const orderKey = (id: string, index: number): string => `quiz:session:${id}:order:${index}`
/** Set once when a question is scored, so concurrent reveal triggers can't double-count points. */
const revealLockKey = (id: string, index: number): string => `quiz:session:${id}:revealed:${index}`

type StoredPlayer = { name: string; oid: string }
type StoredAnswer = { answer: AnswerPayload; answeredAt: number; accuracy: number; correct: boolean; points: number }

/** Fisher–Yates shuffle, returns a new array. */
function shuffle<T>(input: readonly T[]): T[] {
    const out = [...input]
    for (let i = out.length - 1; i > 0; i--) {
        const j = randomInt(0, i + 1)
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

function currentQuestion(session: LiveSession): Question | null {
    if (session.currentIndex < 0 || session.currentIndex >= session.content.questions.length) return null
    return session.content.questions[session.currentIndex]
}

function questionLimitSeconds(session: LiveSession, question: Question): number {
    return question.timeLimitSeconds ?? session.defaultTimeLimit
}

async function persistSession(session: LiveSession, ttl: number): Promise<void> {
    await valkeyClient().set(sessionKey(session.sessionId), JSON.stringify(session), 'EX', ttl)
}

export async function getSession(sessionId: string): Promise<LiveSession | null> {
    const raw = await valkeyClient().get(sessionKey(sessionId))
    if (!raw) return null
    try {
        return JSON.parse(raw) as LiveSession
    } catch (e) {
        logger.error(new Error(`Corrupt quiz session ${sessionId}`, { cause: e }))
        return null
    }
}

function parse<T>(raw: string): T | null {
    try {
        return JSON.parse(raw) as T
    } catch {
        return null
    }
}

function leaderboardFrom(
    playersRaw: Record<string, string>,
    scoresRaw: Record<string, string>,
    correctRaw: Record<string, string>,
    questionCount: number,
): LeaderboardEntry[] {
    const playerScores: PlayerScore[] = Object.entries(playersRaw).flatMap(([userId, raw]) => {
        const player = parse<StoredPlayer>(raw)
        if (!player) return []
        return [
            {
                userId,
                name: player.name,
                points: Number(scoresRaw[userId] ?? 0),
                correctCount: Number(correctRaw[userId] ?? 0),
            },
        ]
    })

    return buildLeaderboard(playerScores, questionCount)
}

/**
 * Builds the answer-hiding {@link PublicQuestion} for a question. For ordering questions it uses the
 * `displayOrder` (item ids) computed once when the question started, so every client sees the same shuffle.
 */
function toPublicQuestion(question: Question, displayOrder: string[] | null): PublicQuestion {
    const base = { id: question.id, text: question.text, imageId: question.imageId }
    switch (question.type) {
        case 'multiple-choice':
            return {
                ...base,
                type: 'multiple-choice',
                choices: question.choices.map((choice) => ({ id: choice.id, text: choice.text })),
            }
        case 'ordering': {
            const byId = new Map(question.items.map((it) => [it.id, it] as const))
            const order = displayOrder?.length ? displayOrder : question.items.map((it) => it.id)
            const items = order.flatMap((id) => {
                const item = byId.get(id)
                return item ? [{ id: item.id, text: item.text }] : []
            })
            return { ...base, type: 'ordering', items }
        }
        case 'slider':
            return {
                ...base,
                type: 'slider',
                slider: { min: question.min, max: question.max, step: question.step },
            }
        case 'text':
            return { ...base, type: 'text' }
    }
}

function revealDataFor(question: Question): RevealData {
    switch (question.type) {
        case 'multiple-choice':
            return {
                type: 'multiple-choice',
                correctChoiceId: question.choices.find((choice) => choice.correct)?.id ?? '',
            }
        case 'ordering':
            return { type: 'ordering', correctOrder: question.items.map((it) => it.id) }
        case 'slider':
            return { type: 'slider', correctValue: question.correct }
        case 'text':
            return { type: 'text', acceptedAnswers: question.acceptedAnswers }
    }
}

function projectState(
    session: LiveSession,
    playersRaw: Record<string, string>,
    answersRaw: Record<string, string>,
    scoresRaw: Record<string, string>,
    correctRaw: Record<string, string>,
    displayOrder: string[] | null,
): ClientSessionState {
    const question = currentQuestion(session)
    const inQuestionPhase = session.status === 'question' || session.status === 'reveal'
    const answered = new Set(Object.keys(answersRaw))

    const players: PlayerPresence[] = Object.entries(playersRaw)
        .flatMap(([userId, raw]): PlayerPresence[] => {
            const player = parse<StoredPlayer>(raw)
            if (!player) return []
            return [
                {
                    userId,
                    name: player.name,
                    oid: player.oid,
                    answered: inQuestionPhase ? answered.has(userId) : false,
                },
            ]
        })
        .sort((a, b) => a.name.localeCompare(b.name))

    const showQuestion = question != null && inQuestionPhase
    const publicQuestion = showQuestion ? toPublicQuestion(question, displayOrder) : null

    let reveal: { data: RevealData; results: RevealResult[] } | null = null
    if (session.status === 'reveal' && question != null) {
        const results: RevealResult[] = Object.entries(answersRaw).flatMap(([userId, raw]) => {
            const stored = parse<StoredAnswer>(raw)
            if (!stored) return []
            return [
                {
                    userId,
                    answer: stored.answer,
                    accuracy: stored.accuracy,
                    correct: stored.correct,
                    points: stored.points,
                },
            ]
        })
        reveal = { data: revealDataFor(question), results }
    }

    const leaderboard =
        session.status === 'reveal' || session.status === 'ended'
            ? leaderboardFrom(playersRaw, scoresRaw, correctRaw, session.content.questions.length)
            : []

    return {
        sessionId: session.sessionId,
        quizTitle: session.quizTitle,
        hostUserId: session.hostUserId,
        status: session.status,
        currentIndex: session.currentIndex,
        questionCount: session.content.questions.length,
        question: publicQuestion,
        startedAt: showQuestion ? session.currentStartedAt : null,
        timeLimitSeconds: showQuestion && question ? questionLimitSeconds(session, question) : null,
        players,
        reveal,
        leaderboard,
    }
}

export async function getClientState(sessionId: string): Promise<ClientSessionState | null> {
    const session = await getSession(sessionId)
    if (!session) return null

    const vk = valkeyClient()
    const [playersRaw, scoresRaw, correctRaw] = await Promise.all([
        vk.hgetall(playersKey(sessionId)),
        vk.hgetall(scoresKey(sessionId)),
        vk.hgetall(correctKey(sessionId)),
    ])

    const inQuestionPhase = session.status === 'question' || session.status === 'reveal'
    const question = currentQuestion(session)
    const answersRaw = inQuestionPhase ? await vk.hgetall(answersKey(sessionId, session.currentIndex)) : {}
    const orderRaw =
        inQuestionPhase && question?.type === 'ordering'
            ? await vk.get(orderKey(sessionId, session.currentIndex))
            : null
    const displayOrder = orderRaw ? parse<string[]>(orderRaw) : null

    return projectState(session, playersRaw, answersRaw, scoresRaw, correctRaw, displayOrder)
}

async function broadcast(sessionId: string): Promise<ClientSessionState | null> {
    const state = await getClientState(sessionId)
    if (state) await publishQuizEvent(sessionId, { type: 'state', state })
    return state
}

/* ────────────────────────────── active sessions index ────────────────────────────── */

async function addActiveSession(session: LiveSession): Promise<void> {
    const vk = valkeyClient()
    await vk.hset(
        ACTIVE_SESSIONS_KEY,
        session.sessionId,
        JSON.stringify({ quizTitle: session.quizTitle, hostName: session.hostName }),
    )
    await publishLobbyChanged()
}

async function removeActiveSession(sessionId: string): Promise<void> {
    await valkeyClient().hdel(ACTIVE_SESSIONS_KEY, sessionId)
    await publishLobbyChanged()
}

export async function listActiveSessions(): Promise<ActiveSession[]> {
    const vk = valkeyClient()
    const raw = await vk.hgetall(ACTIVE_SESSIONS_KEY)

    // Read every indexed session in parallel rather than one-by-one.
    const entries = await Promise.all(
        Object.keys(raw).map(async (sessionId): Promise<ActiveSession | { stale: string }> => {
            const session = await getSession(sessionId)
            if (!session || session.status === 'ended') return { stale: sessionId }

            return {
                sessionId,
                quizTitle: session.quizTitle,
                hostUserId: session.hostUserId,
                hostName: session.hostName,
                playerCount: await vk.hlen(playersKey(sessionId)),
                status: session.status,
            }
        }),
    )

    const stale = entries.flatMap((entry) => ('stale' in entry ? [entry.stale] : []))
    if (stale.length > 0) await vk.hdel(ACTIVE_SESSIONS_KEY, ...stale)

    return entries
        .filter((entry): entry is ActiveSession => !('stale' in entry))
        .sort((a, b) => a.quizTitle.localeCompare(b.quizTitle))
}

/* ──────────────────────────────── auto-reveal ──────────────────────────────── */

async function allPlayersAnswered(sessionId: string, index: number): Promise<boolean> {
    const vk = valkeyClient()
    const [playerIds, answeredIds] = await Promise.all([
        vk.hkeys(playersKey(sessionId)),
        vk.hkeys(answersKey(sessionId, index)),
    ])

    if (playerIds.length === 0) return false
    const answered = new Set(answeredIds)
    return playerIds.every((id) => answered.has(id))
}

/**
 * Schedules a server-side timeout that reveals the answer when the question's time runs out.
 * Runs on whichever pod advanced the question; the callback re-reads authoritative Valkey state,
 * so it's a no-op if the question was already revealed or the host moved on. (If that pod restarts
 * mid-question the timeout is lost — the host can still reveal manually.)
 */
function scheduleAutoReveal(sessionId: string, index: number, delayMs: number): void {
    setTimeout(() => {
        autoRevealOnTimeout(sessionId, index).catch((e) =>
            logger.error(new Error(`Auto-reveal failed for session ${sessionId} q${index}`, { cause: e })),
        )
    }, delayMs)
}

async function autoRevealOnTimeout(sessionId: string, index: number): Promise<void> {
    const session = await getSession(sessionId)
    if (!session || session.status !== 'question' || session.currentIndex !== index) return
    await revealCurrentQuestion(sessionId)
}

/* ────────────────────────────────── mutations ────────────────────────────────── */

export type HostQuizInput = {
    id: string
    title: string
    content: QuizContent
    defaultTimeLimit: number
}

export async function createSession(quiz: HostQuizInput, host: User): Promise<LiveSession> {
    const now = Date.now()
    const session: LiveSession = {
        sessionId: randomUUID(),
        quizId: quiz.id,
        quizTitle: quiz.title,
        hostUserId: host.userId,
        hostName: host.name,
        status: 'lobby',
        currentIndex: -1,
        createdAt: now,
        playStartedAt: null,
        currentStartedAt: null,
        defaultTimeLimit: quiz.defaultTimeLimit,
        content: quiz.content,
    }

    await persistSession(session, TTL)
    await addActiveSession(session)

    return session
}

export async function joinSession(sessionId: string, user: User): Promise<ClientSessionState | null> {
    const session = await getSession(sessionId)
    if (!session) return null

    const vk = valkeyClient()
    const player: StoredPlayer = { name: user.name, oid: user.oid }
    await vk.hset(playersKey(sessionId), user.userId, JSON.stringify(player))
    await vk.expire(playersKey(sessionId), TTL)
    await publishLobbyChanged()

    return broadcast(sessionId)
}

export type SubmitAnswerResult = { ok: true } | { ok: false; reason: string }

const MAX_TEXT_ANSWER_LENGTH = 500

/** Server-side sanity check that a payload is a valid answer for the current question. */
function isValidAnswer(question: Question, answer: AnswerPayload): boolean {
    if (question.type !== answer.type) return false
    switch (question.type) {
        case 'multiple-choice':
            return answer.type === 'multiple-choice' && question.choices.some((c) => c.id === answer.choiceId)
        case 'ordering': {
            if (answer.type !== 'ordering') return false
            const expected = new Set(question.items.map((it) => it.id))
            if (answer.order.length !== expected.size) return false
            const unique = new Set(answer.order)
            // A valid answer is a permutation: same size and every id is one of the expected ids.
            return unique.size === expected.size && answer.order.every((id) => expected.has(id))
        }
        case 'slider':
            return (
                answer.type === 'slider' &&
                Number.isFinite(answer.value) &&
                answer.value >= question.min &&
                answer.value <= question.max
            )
        case 'text':
            return answer.type === 'text' && answer.text.length <= MAX_TEXT_ANSWER_LENGTH
    }
}

export async function submitAnswer(sessionId: string, user: User, answer: AnswerPayload): Promise<SubmitAnswerResult> {
    const session = await getSession(sessionId)
    if (!session) return { ok: false, reason: 'no-session' }
    if (session.status !== 'question') return { ok: false, reason: 'not-accepting' }

    const question = currentQuestion(session)
    if (!question || session.currentStartedAt == null) return { ok: false, reason: 'no-question' }

    const vk = valkeyClient()
    const answersK = answersKey(sessionId, session.currentIndex)
    if (await vk.hexists(answersK, user.userId)) return { ok: false, reason: 'already-answered' }

    const now = Date.now()
    const limitMs = questionLimitSeconds(session, question) * 1000
    if (now > session.currentStartedAt + limitMs + ANSWER_GRACE_MS) return { ok: false, reason: 'locked' }

    if (!isValidAnswer(question, answer)) return { ok: false, reason: 'invalid-answer' }

    const graded = gradeAnswer(question, answer, now - session.currentStartedAt, limitMs)
    const stored: StoredAnswer = {
        answer,
        answeredAt: now,
        accuracy: graded.accuracy,
        correct: graded.correct,
        points: graded.points,
    }
    await vk.hset(answersK, user.userId, JSON.stringify(stored))
    await vk.expire(answersK, TTL)

    // Auto-reveal the moment every joined player has answered; otherwise just push the new state.
    if (await allPlayersAnswered(sessionId, session.currentIndex)) {
        await revealCurrentQuestion(sessionId)
    } else {
        await broadcast(sessionId)
    }
    return { ok: true }
}

/** Reveals + scores the current question. Scores exactly once even under concurrent triggers. */
export async function revealCurrentQuestion(sessionId: string): Promise<ClientSessionState | null> {
    const session = await getSession(sessionId)
    if (!session) return null
    if (session.status !== 'question') return getClientState(sessionId)

    const vk = valkeyClient()
    // The status read above is not atomic with the hincrby below, so atomically claim the scoring:
    // without this, two triggers (auto-reveal timeout, last answer, host "Vis fasit") could both pass
    // the guard and double-count every player's points.
    const claimed = await vk.set(revealLockKey(sessionId, session.currentIndex), '1', 'EX', TTL, 'NX')
    if (claimed == null) return getClientState(sessionId)

    const answersRaw = await vk.hgetall(answersKey(sessionId, session.currentIndex))
    const increments: Promise<unknown>[] = []
    for (const [userId, raw] of Object.entries(answersRaw)) {
        const answer = parse<StoredAnswer>(raw)
        if (!answer) continue
        if (answer.points > 0) increments.push(vk.hincrby(scoresKey(sessionId), userId, answer.points))
        if (answer.correct) increments.push(vk.hincrby(correctKey(sessionId), userId, 1))
    }
    await Promise.all(increments)
    await Promise.all([vk.expire(scoresKey(sessionId), TTL), vk.expire(correctKey(sessionId), TTL)])

    session.status = 'reveal'
    await persistSession(session, TTL)

    return broadcast(sessionId)
}

/** Host-triggered manual reveal (early "Vis fasit"). Verifies the caller is the host. */
export async function revealQuestion(sessionId: string, hostUserId: string): Promise<ClientSessionState | null> {
    const session = await getSession(sessionId)
    if (!session || session.hostUserId !== hostUserId) return null
    return revealCurrentQuestion(sessionId)
}

export async function advanceToNextQuestion(sessionId: string, hostUserId: string): Promise<ClientSessionState | null> {
    const session = await getSession(sessionId)
    if (!session || session.hostUserId !== hostUserId) return null

    const nextIndex = session.currentIndex + 1
    if (nextIndex >= session.content.questions.length) return getClientState(sessionId)

    const nextQuestion = session.content.questions[nextIndex]
    session.currentIndex = nextIndex
    session.status = 'question'
    session.currentStartedAt = Date.now()
    // Record when the quiz actually started (first question) for the session-duration stat.
    if (session.playStartedAt == null) session.playStartedAt = session.currentStartedAt
    await persistSession(session, TTL)
    const vk = valkeyClient()
    // Clear any leftover answers for this index (e.g. if the host restarts a question).
    await vk.del(answersKey(sessionId, nextIndex))
    // Ordering questions get a single shuffled display order, stored so every client/pod agrees.
    if (nextQuestion.type === 'ordering') {
        const order = shuffle(nextQuestion.items.map((it) => it.id))
        await vk.set(orderKey(sessionId, nextIndex), JSON.stringify(order), 'EX', TTL)
    }
    // The lobby list only reflects lobby→started and joins, so only the first question needs to
    // notify it — later advances would just fan out a needless refresh to every lobby viewer.
    if (nextIndex === 0) await publishLobbyChanged()

    // Reveal automatically when the timer (plus the answer grace) elapses.
    const limitMs = questionLimitSeconds(session, nextQuestion) * 1000
    scheduleAutoReveal(sessionId, nextIndex, limitMs + ANSWER_GRACE_MS + 250)

    return broadcast(sessionId)
}

export async function endSession(
    sessionId: string,
    hostUserId: string,
): Promise<(SessionStatsInput & { content: QuizContent }) | null> {
    const session = await getSession(sessionId)
    if (!session || session.hostUserId !== hostUserId) return null

    // Ending while a question is still live ("Avslutt nå"): score it first so already-submitted
    // answers aren't dropped from the final leaderboard (scoring otherwise only happens on reveal).
    if (session.status === 'question') await revealCurrentQuestion(sessionId)

    const vk = valkeyClient()
    const [playersRaw, scoresRaw, correctRaw] = await Promise.all([
        vk.hgetall(playersKey(sessionId)),
        vk.hgetall(scoresKey(sessionId)),
        vk.hgetall(correctKey(sessionId)),
    ])
    const leaderboard = leaderboardFrom(playersRaw, scoresRaw, correctRaw, session.content.questions.length)

    session.status = 'ended'
    session.currentStartedAt = null
    // Keep the ended session around briefly so the final leaderboard stays viewable.
    await persistSession(session, ENDED_TTL)
    await removeActiveSession(sessionId)
    await broadcast(sessionId)

    return {
        quizId: session.quizId,
        hostUserId: session.hostUserId,
        startedAt: new Date(session.createdAt),
        endedAt: new Date(),
        questionCount: session.content.questions.length,
        totalPercent: averagePercent(leaderboard),
        results: leaderboard,
        content: session.content,
    }
}

/**
 * Host-only: close a session that was never played (e.g. abandoned in the lobby). Marks it ended and
 * clears it from the lobby, but records no stats run and leaves the quiz encrypted at rest.
 */
export async function cancelSession(sessionId: string, hostUserId: string): Promise<boolean> {
    const session = await getSession(sessionId)
    if (!session || session.hostUserId !== hostUserId) return false

    session.status = 'ended'
    session.currentStartedAt = null
    await persistSession(session, ENDED_TTL)
    await removeActiveSession(sessionId)
    await broadcast(sessionId)
    return true
}
