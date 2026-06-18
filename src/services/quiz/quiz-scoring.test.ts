import { test, expect } from 'vitest'

import { buildLeaderboard, speedFactor } from '@services/quiz/quiz-scoring'

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
            { userId: 'a@nav.no', name: 'Alice', points: 1500, correctCount: 2 },
            { userId: 'b@nav.no', name: 'Bob', points: 2700, correctCount: 3 },
            { userId: 'c@nav.no', name: 'Cara', points: 0, correctCount: 0 },
        ],
        4,
    )

    expect(leaderboard.map((entry) => entry.userId)).toEqual(['b@nav.no', 'a@nav.no', 'c@nav.no'])
    expect(leaderboard.map((entry) => entry.rank)).toEqual([1, 2, 3])
    expect(leaderboard[0].percent).toBe(75) // 3 / 4
    expect(leaderboard[1].percent).toBe(50) // 2 / 4
    expect(leaderboard[2].percent).toBe(0)
})

test('buildLeaderboard tie-breaks equal points by correct count then name', () => {
    const leaderboard = buildLeaderboard(
        [
            { userId: 'z@nav.no', name: 'Zoe', points: 1000, correctCount: 1 },
            { userId: 'a@nav.no', name: 'Anna', points: 1000, correctCount: 1 },
            { userId: 'm@nav.no', name: 'Mo', points: 1000, correctCount: 2 },
        ],
        3,
    )

    expect(leaderboard.map((entry) => entry.name)).toEqual(['Mo', 'Anna', 'Zoe'])
})
