import { expect, test } from 'vitest'

import { maxRevealStep, podiumRanks, revealButtonLabel, unmaskedRanks } from '#services/quiz/quiz-reveal'

test('podiumRanks counts down from 3rd and trims to the number of players', () => {
    expect(podiumRanks(6)).toEqual([3, 2, 1])
    expect(podiumRanks(3)).toEqual([3, 2, 1])
    expect(podiumRanks(2)).toEqual([2, 1])
    expect(podiumRanks(1)).toEqual([1])
    expect(podiumRanks(0)).toEqual([])
})

test('maxRevealStep adds a final "the rest" step only when someone is off the podium', () => {
    expect(maxRevealStep(6)).toBe(4) // 3rd, 2nd, 1st, then the rest
    expect(maxRevealStep(4)).toBe(4)
    expect(maxRevealStep(3)).toBe(3) // podium is everyone, no extra step
    expect(maxRevealStep(2)).toBe(2)
    expect(maxRevealStep(1)).toBe(1)
})

test('unmaskedRanks reveals the podium bottom-up', () => {
    expect(unmaskedRanks(0, 6)).toEqual(new Set())
    expect(unmaskedRanks(1, 6)).toEqual(new Set([3]))
    expect(unmaskedRanks(2, 6)).toEqual(new Set([3, 2]))
    expect(unmaskedRanks(3, 6)).toEqual(new Set([3, 2, 1]))
    expect(unmaskedRanks(4, 6)).toBe('all')
})

test('unmaskedRanks clamps a step past the end to everyone', () => {
    expect(unmaskedRanks(99, 6)).toBe('all')
    // A host double-clicking can push the stored counter past the max; it must not wrap or throw.
    expect(unmaskedRanks(99, 2)).toBe('all')
})

test('unmaskedRanks reveals everyone on the last podium step when nobody is off the podium', () => {
    // 3 players: after 1st place there is no "rest", so the podium's final step is 'all'.
    expect(unmaskedRanks(2, 3)).toEqual(new Set([3, 2]))
    expect(unmaskedRanks(3, 3)).toBe('all')
})

test('unmaskedRanks is empty for a session nobody played', () => {
    expect(unmaskedRanks(0, 0)).toEqual(new Set())
    expect(unmaskedRanks(5, 0)).toEqual(new Set())
})

test('revealButtonLabel walks the podium then offers the rest, and ends as null', () => {
    expect(revealButtonLabel(0, 6)).toBe('Vis 3. plass')
    expect(revealButtonLabel(1, 6)).toBe('Vis 2. plass')
    expect(revealButtonLabel(2, 6)).toBe('Vis 1. plass')
    expect(revealButtonLabel(3, 6)).toBe('Vis alle navn')
    expect(revealButtonLabel(4, 6)).toBeNull()
})

test('revealButtonLabel has no "rest" step for a podium-sized session', () => {
    expect(revealButtonLabel(0, 2)).toBe('Vis 2. plass')
    expect(revealButtonLabel(1, 2)).toBe('Vis 1. plass')
    expect(revealButtonLabel(2, 2)).toBeNull()
})
