export const MAX_POINTS = 1000
/** A correct (fully accurate) answer at the very last moment still earns this fraction of the max. */
export const MIN_CORRECT_POINTS = 500

/**
 * Kahoot-style speed weighting in [0.5, 1]: a fully accurate answer earns the full multiplier when
 * instant and {@link MIN_CORRECT_POINTS}/{@link MAX_POINTS} of it at the buzzer. Grading multiplies a
 * per-type accuracy in [0,1] by this. Limit ≤ 0 means "no clock", so the factor is 1.
 */
export function speedFactor(elapsedMs: number, limitMs: number): number {
    if (limitMs <= 0) return 1
    const ratio = Math.min(1, Math.max(0, elapsedMs / limitMs))
    return 1 - 0.5 * ratio
}

/** The team's "total percent": the average of every player's percent-correct (0 if no players). */
export function averagePercent(entries: { percent: number }[]): number {
    if (entries.length === 0) return 0
    return Math.round(entries.reduce((sum, entry) => sum + entry.percent, 0) / entries.length)
}

/**
 * A player's raw score, as held server-side. Carries BOTH the real identity (`userId`, `name`,
 * `oid`) and the anonymous one (`playerId`, `alias`).
 */
export type PlayerScore = {
    userId: string
    name: string
    oid: string
    playerId: string
    alias: string
    points: number
    correctCount: number
}

/**
 * A ranked player, server-side only. This is NEVER serialised to a client as-is — it holds the
 * alias→name mapping the whole feature exists to hide. The session service projects it into a
 * {@link LeaderboardEntry}, masking `name`/`oid` until the host reveals that rank.
 */
export type RankedPlayer = PlayerScore & {
    percent: number
    rank: number
}

/**
 * Ranks players by total points (tie-break: more correct, then alias) and computes each
 * player's percent of questions answered correctly.
 *
 * The tie-break uses the ALIAS, not the real name: ranking by name would leak the alphabetical
 * ordering of the real roster through the rendered order of an otherwise anonymous leaderboard.
 */
export function buildLeaderboard(players: PlayerScore[], questionCount: number): RankedPlayer[] {
    const sorted = [...players].sort(
        (a, b) => b.points - a.points || b.correctCount - a.correctCount || a.alias.localeCompare(b.alias),
    )

    return sorted.map((player, index) => ({
        ...player,
        percent: questionCount > 0 ? Math.round((player.correctCount / questionCount) * 100) : 0,
        rank: index + 1,
    }))
}
