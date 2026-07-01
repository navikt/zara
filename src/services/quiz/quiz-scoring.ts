import { LeaderboardEntry } from '#services/quiz/quiz-schema'

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

export type PlayerScore = {
    userId: string
    name: string
    points: number
    correctCount: number
}

/**
 * Ranks players by total points (tie-break: more correct, then name) and computes each
 * player's percent of questions answered correctly.
 */
export function buildLeaderboard(players: PlayerScore[], questionCount: number): LeaderboardEntry[] {
    const sorted = [...players].sort(
        (a, b) => b.points - a.points || b.correctCount - a.correctCount || a.name.localeCompare(b.name),
    )

    return sorted.map((player, index) => ({
        userId: player.userId,
        name: player.name,
        points: player.points,
        correctCount: player.correctCount,
        percent: questionCount > 0 ? Math.round((player.correctCount / questionCount) * 100) : 0,
        rank: index + 1,
    }))
}
