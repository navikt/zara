import { test, expect } from 'vitest'

import { buildLeaderboard, PlayerScore, speedFactor } from '#services/quiz/quiz-scoring'

/** A player score with the identity fields filled in, so tests only state what they care about. */
function score(partial: Partial<PlayerScore> & { alias: string }): PlayerScore {
    return {
        userId: `${partial.alias}@nav.no`,
        name: partial.alias,
        oid: `oid-${partial.alias}`,
        playerId: `pid-${partial.alias}`,
        points: 0,
        correctCount: 0,
        ...partial,
    }
}

test('speedFactor is 1 for an instant answer', () => {
    expect(speedFactor(0, 20_000)).toBe(1)
})

test('speedFactor is 0.5 for an answer at the buzzer and never lower', () => {
    expect(speedFactor(20_000, 20_000)).toBe(0.5)
    // Past the limit is clamped, never below the floor.
    expect(speedFactor(999_999, 20_000)).toBe(0.5)
})

test('speedFactor scales linearly with elapsed time', () => {
    // Halfway through the limit -> halfway between floor and full.
    expect(speedFactor(10_000, 20_000)).toBe(0.75)
})

test('speedFactor is 1 when there is no clock', () => {
    expect(speedFactor(5_000, 0)).toBe(1)
})

test('buildLeaderboard ranks by points then computes percent of questions correct', () => {
    const leaderboard = buildLeaderboard(
        [
            score({ alias: 'Alice', points: 1500, correctCount: 2 }),
            score({ alias: 'Bob', points: 2700, correctCount: 3 }),
            score({ alias: 'Cara', points: 0, correctCount: 0 }),
        ],
        4,
    )

    expect(leaderboard.map((entry) => entry.alias)).toEqual(['Bob', 'Alice', 'Cara'])
    expect(leaderboard.map((entry) => entry.rank)).toEqual([1, 2, 3])
    expect(leaderboard[0].percent).toBe(75) // 3 / 4
    expect(leaderboard[1].percent).toBe(50) // 2 / 4
    expect(leaderboard[2].percent).toBe(0)
})

test('buildLeaderboard tie-breaks equal points by correct count then alias', () => {
    const leaderboard = buildLeaderboard(
        [
            score({ alias: 'Zoe', points: 1000, correctCount: 1 }),
            score({ alias: 'Anna', points: 1000, correctCount: 1 }),
            score({ alias: 'Mo', points: 1000, correctCount: 2 }),
        ],
        3,
    )

    expect(leaderboard.map((entry) => entry.alias)).toEqual(['Mo', 'Anna', 'Zoe'])
})

test('buildLeaderboard tie-breaks by alias, never by real name', () => {
    // Real names are in the reverse order of the aliases: if the sort leaked the name ordering into
    // the rendered leaderboard, an observer could recover it. It must follow the aliases.
    const leaderboard = buildLeaderboard(
        [
            score({ alias: 'Aardvark', name: 'Zenobia', points: 500, correctCount: 1 }),
            score({ alias: 'Zeppelin', name: 'Aage', points: 500, correctCount: 1 }),
        ],
        2,
    )

    expect(leaderboard.map((entry) => entry.alias)).toEqual(['Aardvark', 'Zeppelin'])
})
