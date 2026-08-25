import { logger } from '@navikt/next-logger'

import { pgClient } from '#services/db/postgres/production-pg'
import { decryptJson, encryptJson } from '#services/quiz/quiz-crypto'
import { decryptWithPassphrase } from '#services/quiz/quiz-passphrase-crypto'
import { QuizContent, QuizContentSchema, QuizSummary } from '#services/quiz/quiz-schema'

type QuizRow = {
    id: string
    owner_user_id: string
    is_encrypted: boolean
    content_encrypted: string | null
    content_plain: Record<string, unknown> | null
    salt: string | null
    title: string | null
    question_count: number | null
    default_time_limit: number
    created_at: Date
    last_played_at: Date | null
}

/** Legacy questions (pre question-types) have no `type`/`imageId`; default them to multiple-choice. */
function normalizeLegacyContent(raw: unknown): unknown {
    if (raw == null || typeof raw !== 'object') return raw
    const content = raw as { questions?: unknown }
    if (!Array.isArray(content.questions)) return raw

    return {
        ...content,
        questions: content.questions.map((q) => {
            if (q == null || typeof q !== 'object') return q
            const question = q as Record<string, unknown>
            return { imageId: null, type: question.type ?? 'multiple-choice', ...question }
        }),
    }
}

function parseContent(raw: unknown, quizId: string): QuizContent | null {
    if (raw == null) return null
    const parsed = QuizContentSchema.safeParse(normalizeLegacyContent(raw))
    if (!parsed.success) {
        logger.error(new Error(`Quiz ${quizId} content failed validation`, { cause: parsed.error }))
        return null
    }
    return parsed.data
}

/**
 * Content available WITHOUT a passphrase: a quiz encrypted with the app secret (salt = null), or one
 * opened to plaintext by the older "open after session" behaviour. Only LEGACY passphrase-encrypted
 * quizzes (salt set) return null — callers must supply the passphrase via {@link getQuizContent}.
 */
function readOpenableContent(row: QuizRow): QuizContent | null {
    if (!row.is_encrypted) return parseContent(row.content_plain, row.id)
    if (row.salt == null && row.content_encrypted != null) {
        return parseContent(decryptJson(row.content_encrypted), row.id)
    }
    return null
}

function summaryOf(row: QuizRow): QuizSummary {
    // Prefer the plaintext title/count columns; fall back to openable content for legacy rows.
    const openable = row.title == null || row.question_count == null ? readOpenableContent(row) : null
    return {
        id: row.id,
        ownerUserId: row.owner_user_id,
        title: row.title ?? openable?.title ?? '(kryptert quiz)',
        questionCount: row.question_count ?? openable?.questions.length ?? 0,
        defaultTimeLimit: row.default_time_limit,
        isEncrypted: row.is_encrypted,
        needsPassphrase: row.is_encrypted && row.salt != null,
        isShared: row.last_played_at != null,
        createdAt: row.created_at.toISOString(),
        lastPlayedAt: row.last_played_at?.toISOString() ?? null,
    }
}

export async function createQuiz(ownerUserId: string, content: QuizContent, defaultTimeLimit: number): Promise<string> {
    const client = await pgClient()
    const result = await client.query<{ id: string }>(
        `INSERT INTO quiz
             (owner_user_id, is_encrypted, content_encrypted, salt, title, question_count, default_time_limit)
         VALUES ($1, true, $2, NULL, $3, $4, $5)
         RETURNING id`,
        [ownerUserId, encryptJson(content), content.title, content.questions.length, defaultTimeLimit],
    )

    return result.rows[0].id
}

/**
 * Re-encrypts the quiz under the app secret. Shared (played) quizzes are immutable, hence the
 * `last_played_at IS NULL` guard. Saving also clears `salt`, which is how a legacy passphrase quiz
 * is silently upgraded to app-secret encryption the first time its owner edits it.
 */
export async function updateQuiz(
    id: string,
    ownerUserId: string,
    content: QuizContent,
    defaultTimeLimit: number,
): Promise<boolean> {
    const client = await pgClient()
    const result = await client.query(
        `UPDATE quiz
         SET content_encrypted = $1, salt = NULL, content_plain = NULL, is_encrypted = true,
             title = $2, question_count = $3, default_time_limit = $4
         WHERE id = $5 AND owner_user_id = $6 AND last_played_at IS NULL`,
        [encryptJson(content), content.title, content.questions.length, defaultTimeLimit, id, ownerUserId],
    )

    return (result.rowCount ?? 0) > 0
}

/**
 * Metadata columns for the list/summary paths — deliberately omits the (potentially large) encrypted
 * content blobs, since the plaintext title/question_count columns exist precisely so the list works
 * without them. `summaryOf` only reads content as a fallback for legacy rows with a null title.
 */
const SUMMARY_COLUMNS =
    'id, owner_user_id, is_encrypted, salt, title, question_count, default_time_limit, created_at, last_played_at'

export async function listMyQuizzes(ownerUserId: string): Promise<QuizSummary[]> {
    const client = await pgClient()
    const result = await client.query<QuizRow>(
        `SELECT ${SUMMARY_COLUMNS} FROM quiz WHERE owner_user_id = $1 ORDER BY created_at DESC`,
        [ownerUserId],
    )

    return result.rows.map(summaryOf)
}

/**
 * The team's shared library: every quiz that has been played through to the end, which is therefore
 * immutable and hostable by anyone. Excludes the caller's own quizzes — those already show under
 * "Mine quizer". A draft that has never been played stays private to its owner.
 */
export async function listSharedQuizzes(excludeOwnerUserId: string): Promise<QuizSummary[]> {
    const client = await pgClient()
    const result = await client.query<QuizRow>(
        `SELECT ${SUMMARY_COLUMNS} FROM quiz
         WHERE last_played_at IS NOT NULL AND owner_user_id <> $1
         ORDER BY last_played_at DESC`,
        [excludeOwnerUserId],
    )

    return result.rows.map(summaryOf)
}

/**
 * Metadata only (no decryption) — for the results page and the legacy passphrase gates. Readable by
 * the owner, or by anyone once the quiz has been played and shared.
 */
export async function getQuizMeta(id: string, userId: string): Promise<QuizSummary | null> {
    const client = await pgClient()
    const result = await client.query<QuizRow>(
        `SELECT ${SUMMARY_COLUMNS} FROM quiz
         WHERE id = $1 AND (owner_user_id = $2 OR last_played_at IS NOT NULL)`,
        [id, userId],
    )
    const row = result.rows[0]
    return row ? summaryOf(row) : null
}

export type LoadContentResult =
    | { ok: true; content: QuizContent; defaultTimeLimit: number }
    | { ok: false; reason: 'not-found' | 'wrong-passphrase' }

/** Turns a row into its decrypted content, asking for the passphrase only on legacy rows. */
async function decryptRow(row: QuizRow, passphrase: string | null): Promise<LoadContentResult> {
    const openable = readOpenableContent(row)
    if (openable) return { ok: true, content: openable, defaultTimeLimit: row.default_time_limit }

    // Only LEGACY passphrase rows get this far.
    if (row.salt == null || row.content_encrypted == null) return { ok: false, reason: 'not-found' }
    if (!passphrase) return { ok: false, reason: 'wrong-passphrase' }

    const decrypted = await decryptWithPassphrase(row.content_encrypted, row.salt, passphrase)
    const content = parseContent(decrypted, row.id)
    if (!content) return { ok: false, reason: 'wrong-passphrase' }

    return { ok: true, content, defaultTimeLimit: row.default_time_limit }
}

/**
 * Loads a quiz's full content for EDITING — owner only. Legacy passphrase-encrypted quizzes require
 * the correct passphrase (wrong → 'wrong-passphrase'); everything else decrypts with the app secret.
 */
export async function getQuizContent(
    id: string,
    ownerUserId: string,
    passphrase: string | null,
): Promise<LoadContentResult> {
    const client = await pgClient()
    const result = await client.query<QuizRow>(`SELECT * FROM quiz WHERE id = $1 AND owner_user_id = $2`, [
        id,
        ownerUserId,
    ])
    const row = result.rows[0]
    if (!row) return { ok: false, reason: 'not-found' }

    return decryptRow(row, passphrase)
}

/**
 * Loads content for HOSTING or DUPLICATING: the owner's own quizzes, plus any quiz the team has
 * played (shared). Shared quizzes are always app-secret encrypted, so they never need a passphrase.
 */
export async function getPlayableQuizContent(
    id: string,
    userId: string,
    passphrase: string | null,
): Promise<LoadContentResult> {
    const client = await pgClient()
    const result = await client.query<QuizRow>(
        `SELECT * FROM quiz WHERE id = $1 AND (owner_user_id = $2 OR last_played_at IS NOT NULL)`,
        [id, userId],
    )
    const row = result.rows[0]
    if (!row) return { ok: false, reason: 'not-found' }

    return decryptRow(row, passphrase)
}

/** Shared quizzes are immutable, so only a never-played draft can be deleted (by its owner). */
export async function deleteQuiz(id: string, ownerUserId: string): Promise<void> {
    const client = await pgClient()
    await client.query(`DELETE FROM quiz WHERE id = $1 AND owner_user_id = $2 AND last_played_at IS NULL`, [
        id,
        ownerUserId,
    ])
}

/**
 * After a session ends the quiz becomes shared with the team: `last_played_at` is stamped, and the
 * content is re-encrypted under the app secret from the live session's already-decrypted copy. That
 * last part matters for legacy quizzes — dropping the salt is what lets everyone else open it later.
 */
export async function markQuizPlayed(id: string, content: QuizContent): Promise<void> {
    const client = await pgClient()
    await client.query(
        `UPDATE quiz
         SET content_encrypted = $1, salt = NULL, content_plain = NULL, is_encrypted = true,
             title = $2, question_count = $3, last_played_at = now()
         WHERE id = $4`,
        [encryptJson(content), content.title, content.questions.length, id],
    )
}

/**
 * A player's final result as persisted. Unlike the client-facing leaderboard this holds the REAL
 * identity — the alias only exists to keep the live scoreboard anonymous, and the stored run is
 * the post-hoc record.
 */
export type PersistedPlayerResult = {
    userId: string
    name: string
    points: number
    correctCount: number
    percent: number
    rank: number
}

export type SessionStatsInput = {
    quizId: string
    hostUserId: string
    startedAt: Date
    endedAt: Date
    questionCount: number
    /** The team's overall percent for this run (average of every player's percent). */
    totalPercent: number
    results: PersistedPlayerResult[]
}

/** Requirement 7: persist per-session stats into their own tables. */
export async function saveSessionStats(input: SessionStatsInput): Promise<void> {
    // BEGIN/COMMIT must run on a single checked-out connection — `pool.query` can dispatch each
    // statement to a different pooled connection, so the "transaction" wouldn't actually be one.
    const client = await (await pgClient()).connect()

    try {
        await client.query('BEGIN')
        const session = await client.query<{ id: string }>(
            `INSERT INTO quiz_session
                 (quiz_id, host_user_id, started_at, ended_at, player_count, question_count, total_percent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [
                input.quizId,
                input.hostUserId,
                input.startedAt.toISOString(),
                input.endedAt.toISOString(),
                input.results.length,
                input.questionCount,
                input.totalPercent,
            ],
        )
        const sessionId = session.rows[0].id

        // One multi-row insert for all player results rather than a round-trip per player.
        if (input.results.length > 0) {
            await client.query(
                `INSERT INTO quiz_player_result
                     (session_id, player_user_id, player_name, points, correct_count, percent, rank)
                 SELECT $1::uuid, player_user_id, player_name, points, correct_count, percent, rank
                 FROM unnest($2::text[], $3::text[], $4::int[], $5::int[], $6::int[], $7::int[])
                     AS t(player_user_id, player_name, points, correct_count, percent, rank)`,
                [
                    sessionId,
                    input.results.map((entry) => entry.userId),
                    input.results.map((entry) => entry.name),
                    input.results.map((entry) => entry.points),
                    input.results.map((entry) => entry.correctCount),
                    input.results.map((entry) => entry.percent),
                    input.results.map((entry) => entry.rank),
                ],
            )
        }

        await client.query('COMMIT')
    } catch (e) {
        await client.query('ROLLBACK')
        throw new Error(`Failed to save quiz session stats for quiz ${input.quizId}`, { cause: e })
    } finally {
        client.release()
    }
}

export type QuizRunPlayer = {
    name: string
    points: number
    percent: number
    correctCount: number
    rank: number
}

export type QuizRun = {
    id: string
    startedAt: string
    endedAt: string
    playerCount: number
    questionCount: number
    totalPercent: number
    players: QuizRunPlayer[]
}

/**
 * All finished runs of a quiz, newest first, with each run's per-player results. Visible to the
 * owner, and to everyone once the quiz has been played and shared.
 */
export async function listQuizRuns(quizId: string, userId: string): Promise<QuizRun[]> {
    const client = await pgClient()

    const visible = await client.query(
        'SELECT 1 FROM quiz WHERE id = $1 AND (owner_user_id = $2 OR last_played_at IS NOT NULL)',
        [quizId, userId],
    )
    if ((visible.rowCount ?? 0) === 0) return []

    const sessions = await client.query<{
        id: string
        started_at: Date
        ended_at: Date
        player_count: number
        question_count: number
        total_percent: number
    }>(
        `SELECT id, started_at, ended_at, player_count, question_count, total_percent
         FROM quiz_session WHERE quiz_id = $1 ORDER BY ended_at DESC`,
        [quizId],
    )

    if (sessions.rows.length === 0) return []

    // One query for every run's players, then group in JS (avoids an N+1 query per session).
    const players = await client.query<{
        session_id: string
        player_name: string
        points: number
        percent: number
        correct_count: number
        rank: number
    }>(
        `SELECT session_id, player_name, points, percent, correct_count, rank
         FROM quiz_player_result WHERE session_id = ANY($1::uuid[]) ORDER BY rank ASC`,
        [sessions.rows.map((session) => session.id)],
    )

    const playersBySession = new Map<string, QuizRunPlayer[]>()
    for (const player of players.rows) {
        const list = playersBySession.get(player.session_id) ?? []
        list.push({
            name: player.player_name,
            points: player.points,
            percent: player.percent,
            correctCount: player.correct_count,
            rank: player.rank,
        })
        playersBySession.set(player.session_id, list)
    }

    return sessions.rows.map((session) => ({
        id: session.id,
        startedAt: session.started_at.toISOString(),
        endedAt: session.ended_at.toISOString(),
        playerCount: session.player_count,
        questionCount: session.question_count,
        totalPercent: session.total_percent,
        players: playersBySession.get(session.id) ?? [],
    }))
}
