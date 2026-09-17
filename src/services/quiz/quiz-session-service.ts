import { logger } from '@navikt/next-logger'
import { TimeUnit } from '@valkey/valkey-glide'
import { createHash, randomInt, randomUUID } from 'node:crypto'

import { User } from '#services/auth/user'
import { realValkey } from '#services/db/valkey/production-valkey'
import { hashToRecord } from '#services/db/valkey/utils'
import { gradeAnswer } from '#services/quiz/quiz-grading'
import { publishLobbyChanged, publishQuizEvent } from '#services/quiz/quiz-pubsub-client'
import { maxRevealStep, unmaskedRanks } from '#services/quiz/quiz-reveal'
import {
    ActiveSession,
    AnswerPayload,
    ClientSessionState,
    LeaderboardEntry,
    LiveSession,
    LobbyPlayer,
    PlayerPresence,
    PublicQuestion,
    Question,
    QuizContent,
    RevealData,
    RevealResult,
} from '#services/quiz/quiz-schema'
import { averagePercent, buildLeaderboard, PlayerScore, RankedPlayer } from '#services/quiz/quiz-scoring'
import { SessionStatsInput } from '#services/quiz/quiz-store'

const TTL = 6 * 60 * 60
const ENDED_TTL = 30 * 60
/** Grace window for network latency when checking whether an answer arrived in time. */
const ANSWER_GRACE_MS = 1500
const ACTIVE_SESSIONS_KEY = 'quiz:active-sessions'

const sessionKey = (id: string): string => `quiz:session:${id}`
const playersKey = (id: string): string => `quiz:session:${id}:players`
/** Set of lowercased aliases already claimed in this session; SADD is the atomic claim. */
const aliasesKey = (id: string): string => `quiz:session:${id}:aliases`
/** How many podium places the host has unmasked. Its own key so reveals can use an atomic INCR. */
const revealStepKey = (id: string): string => `quiz:session:${id}:reveal-step`
const answersKey = (id: string, index: number): string => `quiz:session:${id}:answers:${index}`
const scoresKey = (id: string): string => `quiz:session:${id}:scores`
const correctKey = (id: string): string => `quiz:session:${id}:correct`
/** The once-computed shuffled display order (item ids) for an ordering question at `index`. */
const orderKey = (id: string, index: number): string => `quiz:session:${id}:order:${index}`
/** Set once when a question is scored, so concurrent reveal triggers can't double-count points. */
const revealLockKey = (id: string, index: number): string => `quiz:session:${id}:revealed:${index}`

/**
 * A player as stored in Valkey. Holds both identities; the projection decides which half (if any)
 * a client is allowed to see.
 */
export type StoredPlayer = { playerId: string; alias: string; name: string; oid: string }
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
    const vk = await realValkey()
    await vk.set(sessionKey(session.sessionId), JSON.stringify(session), {
        expiry: { type: TimeUnit.Seconds, count: ttl },
    })
}

export async function getSession(sessionId: string): Promise<LiveSession | null> {
    const vk = await realValkey()
    const raw = await vk.get(sessionKey(sessionId))
    if (!raw) return null
    try {
        return JSON.parse(String(raw)) as LiveSession
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

/**
 * Parses a stored player, tolerating records written before aliases existed: those fall back to
 * using the real name as the alias, so sessions that were already live across a deploy finish
 * gracefully instead of crashing the projection.
 *
 * The fallback id is DERIVED, not random: the projection runs on every broadcast, so a random id
 * would change identity between frames — churning React keys and never matching the `playerId` the
 * play page handed the client. Derivation is fine here because a legacy player's alias is their
 * real name anyway, so there is no mapping left to protect.
 */
function parsePlayer(userId: string, raw: string): StoredPlayer | null {
    const stored = parse<Partial<StoredPlayer>>(raw)
    if (!stored || typeof stored.name !== 'string') return null
    return {
        playerId: stored.playerId ?? `legacy-${createHash('sha256').update(userId).digest('hex').slice(0, 16)}`,
        alias: stored.alias ?? stored.name,
        name: stored.name,
        oid: stored.oid ?? '',
    }
}

/** Every player in the session, keyed by their (real) userId. */
function parsePlayers(playersRaw: Record<string, string>): Map<string, StoredPlayer> {
    const players = new Map<string, StoredPlayer>()
    for (const [userId, raw] of Object.entries(playersRaw)) {
        const player = parsePlayer(userId, raw)
        if (player) players.set(userId, player)
    }
    return players
}

/**
 * Ranks the session's players. The result carries real names — it is server-side only, and callers
 * must project it through {@link toLeaderboardEntries} before it goes anywhere near a client.
 */
function rankPlayers(
    players: Map<string, StoredPlayer>,
    scoresRaw: Record<string, string>,
    correctRaw: Record<string, string>,
    questionCount: number,
): RankedPlayer[] {
    const playerScores: PlayerScore[] = [...players].map(([userId, player]) => ({
        userId,
        name: player.name,
        oid: player.oid,
        playerId: player.playerId,
        alias: player.alias,
        points: Number(scoresRaw[userId] ?? 0),
        correctCount: Number(correctRaw[userId] ?? 0),
    }))

    return buildLeaderboard(playerScores, questionCount)
}

/**
 * Projects ranked players into the client DTO, unmasking `name`/`oid` only for the ranks the host
 * has already revealed. This is the single place real identities are allowed back into a payload.
 */
function toLeaderboardEntries(ranked: RankedPlayer[], unmasked: Set<number> | 'all'): LeaderboardEntry[] {
    return ranked.map((player) => {
        const revealed = unmasked === 'all' || unmasked.has(player.rank)
        return {
            playerId: player.playerId,
            alias: player.alias,
            name: revealed ? player.name : null,
            oid: revealed ? player.oid : null,
            points: player.points,
            correctCount: player.correctCount,
            percent: player.percent,
            rank: player.rank,
        }
    })
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

/**
 * Builds the payload every client receives. This is the privacy boundary: while the session is in
 * the lobby it emits real names (and nothing else about a player), and from the moment the quiz
 * starts it emits aliases only, until the host's podium reveal unmasks ranks one at a time.
 *
 * Exported for tests — it's a pure function, and the "no name and alias in the same payload"
 * invariant is worth asserting directly rather than through Valkey.
 */
export function projectState(
    session: LiveSession,
    playersRaw: Record<string, string>,
    answersRaw: Record<string, string>,
    scoresRaw: Record<string, string>,
    correctRaw: Record<string, string>,
    displayOrder: string[] | null,
    revealStep: number,
): ClientSessionState {
    const question = currentQuestion(session)
    const inQuestionPhase = session.status === 'question' || session.status === 'reveal'
    const answered = new Set(Object.keys(answersRaw))
    const players = parsePlayers(playersRaw)
    const inLobby = session.status === 'lobby'

    const ranked = rankPlayers(players, scoresRaw, correctRaw, session.content.questions.length)
    const revealMaxStep = maxRevealStep(ranked.length)
    // Nobody is unmasked until the quiz is over and the host starts the ceremony.
    const unmasked = session.status === 'ended' ? unmaskedRanks(revealStep, ranked.length) : new Set<number>()
    const unmaskedPlayerIds = new Set(
        ranked.filter((p) => unmasked === 'all' || unmasked.has(p.rank)).map((p) => p.playerId),
    )

    // Lobby: real names, no alias and no playerId — there is nothing here to correlate with the
    // anonymous list below. Sorted by name, which is safe because this phase is not anonymous.
    const lobbyRoster: LobbyPlayer[] = inLobby
        ? [...players.values()]
              .map((player) => ({ oid: player.oid, name: player.name }))
              .sort((a, b) => a.name.localeCompare(b.name))
        : []

    // Play: aliases only. Sorted by ALIAS — sorting by name would leak the alphabetical ordering
    // of the real roster through the rendered order.
    const presence: PlayerPresence[] = inLobby
        ? []
        : [...players]
              .map(([userId, player]): PlayerPresence => {
                  const revealed = unmaskedPlayerIds.has(player.playerId)
                  return {
                      playerId: player.playerId,
                      alias: player.alias,
                      name: revealed ? player.name : null,
                      oid: revealed ? player.oid : null,
                      answered: inQuestionPhase ? answered.has(userId) : false,
                  }
              })
              .sort((a, b) => a.alias.localeCompare(b.alias))

    const showQuestion = question != null && inQuestionPhase
    const publicQuestion = showQuestion ? toPublicQuestion(question, displayOrder) : null

    let reveal: { data: RevealData; results: RevealResult[] } | null = null
    if (session.status === 'reveal' && question != null) {
        const results: RevealResult[] = Object.entries(answersRaw).flatMap(([userId, raw]) => {
            const stored = parse<StoredAnswer>(raw)
            const player = players.get(userId)
            if (!stored || !player) return []
            return [
                {
                    playerId: player.playerId,
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
        session.status === 'reveal' || session.status === 'ended' ? toLeaderboardEntries(ranked, unmasked) : []

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
        lobbyRoster,
        players: presence,
        reveal,
        leaderboard,
        revealStep: Math.min(revealStep, revealMaxStep),
        revealMaxStep,
    }
}

export async function getClientState(sessionId: string): Promise<ClientSessionState | null> {
    const session = await getSession(sessionId)
    if (!session) return null

    const vk = await realValkey()
    const [playersRaw, scoresRaw, correctRaw] = await Promise.all([
        vk.hgetall(playersKey(sessionId)).then(hashToRecord),
        vk.hgetall(scoresKey(sessionId)).then(hashToRecord),
        vk.hgetall(correctKey(sessionId)).then(hashToRecord),
    ])

    const inQuestionPhase = session.status === 'question' || session.status === 'reveal'
    const question = currentQuestion(session)
    const answersRaw = inQuestionPhase
        ? hashToRecord(await vk.hgetall(answersKey(sessionId, session.currentIndex)))
        : {}
    const orderRaw =
        inQuestionPhase && question?.type === 'ordering'
            ? await vk.get(orderKey(sessionId, session.currentIndex))
            : null
    const displayOrder = orderRaw ? parse<string[]>(String(orderRaw)) : null
    // Only the ended session has a ceremony to track; skip the read entirely otherwise.
    const revealStepRaw = session.status === 'ended' ? await vk.get(revealStepKey(sessionId)) : null

    return projectState(
        session,
        playersRaw,
        answersRaw,
        scoresRaw,
        correctRaw,
        displayOrder,
        Number(revealStepRaw ?? 0),
    )
}

async function broadcast(sessionId: string): Promise<ClientSessionState | null> {
    const state = await getClientState(sessionId)
    if (state) await publishQuizEvent(sessionId, { type: 'state', state })
    return state
}

/* ────────────────────────────── active sessions index ────────────────────────────── */

async function addActiveSession(session: LiveSession): Promise<void> {
    const vk = await realValkey()
    await vk.hset(ACTIVE_SESSIONS_KEY, {
        [session.sessionId]: JSON.stringify({ quizTitle: session.quizTitle, hostName: session.hostName }),
    })
    await publishLobbyChanged()
}

async function removeActiveSession(sessionId: string): Promise<void> {
    const vk = await realValkey()
    await vk.hdel(ACTIVE_SESSIONS_KEY, [sessionId])
    await publishLobbyChanged()
}

export async function listActiveSessions(): Promise<ActiveSession[]> {
    const vk = await realValkey()
    const raw = hashToRecord(await vk.hgetall(ACTIVE_SESSIONS_KEY))

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
    if (stale.length > 0) await vk.hdel(ACTIVE_SESSIONS_KEY, stale)

    return entries
        .filter((entry): entry is ActiveSession => !('stale' in entry))
        .sort((a, b) => a.quizTitle.localeCompare(b.quizTitle))
}

/* ──────────────────────────────── auto-reveal ──────────────────────────────── */

async function allPlayersAnswered(sessionId: string, index: number): Promise<boolean> {
    const vk = await realValkey()
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

export type JoinResult =
    | { ok: true; player: StoredPlayer }
    | { ok: false; reason: 'no-session' | 'ended' | 'alias-taken' }

/** The caller's player record for a session, or null if they haven't joined. */
export async function getSessionPlayer(sessionId: string, userId: string): Promise<StoredPlayer | null> {
    const vk = await realValkey()
    const raw = await vk.hget(playersKey(sessionId), userId)
    return raw ? parsePlayer(userId, String(raw)) : null
}

/**
 * Joins a player under the alias they picked. Idempotent: rejoining (or refreshing) returns the
 * existing record, and an alias is immutable for the life of the session so nobody can shed a bad
 * result by renaming.
 */
export async function joinSession(sessionId: string, user: User, alias: string): Promise<JoinResult> {
    const session = await getSession(sessionId)
    if (!session) return { ok: false, reason: 'no-session' }

    const vk = await realValkey()
    const existing = await getSessionPlayer(sessionId, user.userId)
    if (existing) return { ok: true, player: existing }

    // Joining a finished quiz would insert a new last place mid-ceremony, shifting everyone's rank
    // and the number of reveal steps under the host. Late is late.
    if (session.status === 'ended') return { ok: false, reason: 'ended' }

    // SADD is the atomic claim: two players racing on the same alias, the second gets 0 back.
    const claimed = await vk.sadd(aliasesKey(sessionId), [alias.toLowerCase()])
    if (claimed === 0) return { ok: false, reason: 'alias-taken' }
    await vk.expire(aliasesKey(sessionId), TTL)

    const player: StoredPlayer = { playerId: randomUUID(), alias, name: user.name, oid: user.oid }
    await vk.hset(playersKey(sessionId), { [user.userId]: JSON.stringify(player) })
    await vk.expire(playersKey(sessionId), TTL)
    await publishLobbyChanged()
    await broadcast(sessionId)

    return { ok: true, player }
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

    const vk = await realValkey()
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
    await vk.hset(answersK, { [user.userId]: JSON.stringify(stored) })
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

    const vk = await realValkey()
    // The status read above is not atomic with the hincrby below, so atomically claim the scoring:
    // without this, two triggers (auto-reveal timeout, last answer, host "Vis fasit") could both pass
    // the guard and double-count every player's points.
    const claimed = await vk.set(revealLockKey(sessionId, session.currentIndex), '1', {
        conditionalSet: 'onlyIfDoesNotExist',
        expiry: { type: TimeUnit.Seconds, count: TTL },
    })
    if (claimed == null) return getClientState(sessionId)

    const answersRaw = hashToRecord(await vk.hgetall(answersKey(sessionId, session.currentIndex)))
    const increments: Promise<unknown>[] = []
    for (const [userId, raw] of Object.entries(answersRaw)) {
        const answer = parse<StoredAnswer>(raw)
        if (!answer) continue
        if (answer.points > 0) increments.push(vk.hincrBy(scoresKey(sessionId), userId, answer.points))
        if (answer.correct) increments.push(vk.hincrBy(correctKey(sessionId), userId, 1))
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
    const vk = await realValkey()
    // Clear any leftover answers for this index (e.g. if the host restarts a question).
    await vk.del([answersKey(sessionId, nextIndex)])
    // Ordering questions get a single shuffled display order, stored so every client/pod agrees.
    if (nextQuestion.type === 'ordering') {
        const order = shuffle(nextQuestion.items.map((it) => it.id))
        await vk.set(orderKey(sessionId, nextIndex), JSON.stringify(order), {
            expiry: { type: TimeUnit.Seconds, count: TTL },
        })
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

    const vk = await realValkey()
    const [playersRaw, scoresRaw, correctRaw] = await Promise.all([
        vk.hgetall(playersKey(sessionId)).then(hashToRecord),
        vk.hgetall(scoresKey(sessionId)).then(hashToRecord),
        vk.hgetall(correctKey(sessionId)).then(hashToRecord),
    ])
    const ranked = rankPlayers(parsePlayers(playersRaw), scoresRaw, correctRaw, session.content.questions.length)

    session.status = 'ended'
    session.currentStartedAt = null
    // Keep the ended session around briefly so the final leaderboard stays viewable.
    await persistSession(session, ENDED_TTL)
    // The podium ceremony starts masked, however the previous run of this quiz ended.
    await vk.set(revealStepKey(sessionId), '0', { expiry: { type: TimeUnit.Seconds, count: ENDED_TTL } })
    await removeActiveSession(sessionId)
    await broadcast(sessionId)

    return {
        quizId: session.quizId,
        hostUserId: session.hostUserId,
        startedAt: new Date(session.createdAt),
        endedAt: new Date(),
        questionCount: session.content.questions.length,
        totalPercent: averagePercent(ranked),
        // Stats are the post-hoc record, so they persist the REAL identity, not the alias.
        results: ranked.map((player) => ({
            userId: player.userId,
            name: player.name,
            points: player.points,
            correctCount: player.correctCount,
            percent: player.percent,
            rank: player.rank,
        })),
        content: session.content,
    }
}

/**
 * Host-only: unmask the next podium place (3rd, then 2nd, then 1st), and finally everyone below the
 * podium. INCR is atomic, so an impatient host double-clicking can't corrupt the step; the read
 * side clamps it to the maximum for the player count.
 */
export async function revealNextPlace(sessionId: string, hostUserId: string): Promise<ClientSessionState | null> {
    const session = await getSession(sessionId)
    if (!session || session.hostUserId !== hostUserId) return null
    if (session.status !== 'ended') return getClientState(sessionId)

    const vk = await realValkey()
    await vk.incr(revealStepKey(sessionId))
    await vk.expire(revealStepKey(sessionId), ENDED_TTL)

    return broadcast(sessionId)
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
