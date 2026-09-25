import { expect, test } from 'vitest'

import { ClientSessionState, LiveSession, QuizContent } from '#services/quiz/quiz-schema'
import { projectState } from '#services/quiz/quiz-session-service'

const CONTENT: QuizContent = {
    title: 'Fredagsquiz',
    questions: [
        {
            id: 'q1',
            type: 'multiple-choice',
            shuffleChoices: false,
            text: 'Hva er hovedstaden i Norge?',
            timeLimitSeconds: null,
            imageId: null,
            choices: [
                { id: 'c1', text: 'Oslo', correct: true },
                { id: 'c2', text: 'Bergen', correct: false },
            ],
        },
    ],
}

function session(status: LiveSession['status']): LiveSession {
    return {
        sessionId: 'session-1',
        quizId: 'quiz-1',
        quizTitle: CONTENT.title,
        hostUserId: 'host@nav.no',
        hostName: 'Vert Vertsen',
        status,
        currentIndex: status === 'lobby' ? -1 : 0,
        createdAt: 1_000,
        playStartedAt: status === 'lobby' ? null : 2_000,
        currentStartedAt: status === 'lobby' ? null : 2_000,
        defaultTimeLimit: 30,
        content: CONTENT,
    }
}

/** Three players whose aliases sort in the opposite order to their real names. */
const PLAYERS: Record<string, string> = {
    'anna@nav.no': JSON.stringify({ playerId: 'pid-anna', alias: 'Zebra', name: 'Anna', oid: 'oid-anna' }),
    'bjorn@nav.no': JSON.stringify({ playerId: 'pid-bjorn', alias: 'Ulv', name: 'Bjørn', oid: 'oid-bjorn' }),
    'cecilie@nav.no': JSON.stringify({ playerId: 'pid-cecilie', alias: 'Aap', name: 'Cecilie', oid: 'oid-cecilie' }),
}

// Cecilie wins, Bjørn second, Anna third.
const SCORES: Record<string, string> = { 'cecilie@nav.no': '900', 'bjorn@nav.no': '600', 'anna@nav.no': '300' }
const CORRECT: Record<string, string> = { 'cecilie@nav.no': '1', 'bjorn@nav.no': '1', 'anna@nav.no': '1' }

function project(status: LiveSession['status'], revealStep = 0): ClientSessionState {
    return projectState(session(status), PLAYERS, {}, SCORES, CORRECT, null, revealStep)
}

test('the lobby shows real names and no alias or playerId', () => {
    const state = project('lobby')

    expect(state.lobbyRoster.map((p) => p.name)).toEqual(['Anna', 'Bjørn', 'Cecilie'])
    // The anonymous list is empty in the lobby, so the two can never be seen side by side.
    expect(state.players).toEqual([])

    const serialised = JSON.stringify(state)
    for (const alias of ['Zebra', 'Ulv', 'Aap']) {
        expect(serialised).not.toContain(alias)
    }
    for (const playerId of ['pid-anna', 'pid-bjorn', 'pid-cecilie']) {
        expect(serialised).not.toContain(playerId)
    }
})

test('once the quiz starts the payload has aliases and no real identity at all', () => {
    const state = project('question')

    expect(state.lobbyRoster).toEqual([])
    expect(state.players.map((p) => p.alias)).toEqual(['Aap', 'Ulv', 'Zebra'])
    expect(state.players.every((p) => p.name === null && p.oid === null)).toBe(true)

    const serialised = JSON.stringify(state)
    // No player's real name, email or avatar id may reach a client mid-quiz. (`hostUserId` is
    // exempt: the quizmaster is deliberately named, and already is in the lobby listing.)
    const leaks = [
        'Anna',
        'Bjørn',
        'Cecilie',
        'anna@nav.no',
        'bjorn@nav.no',
        'cecilie@nav.no',
        'oid-anna',
        'oid-bjorn',
        'oid-cecilie',
    ]
    for (const leak of leaks) {
        expect(serialised).not.toContain(leak)
    }
})

test('the play-phase player list is sorted by alias, not by real name', () => {
    // Real names sort Anna < Bjørn < Cecilie; aliases sort Aap < Ulv < Zebra. Sorting by name would
    // leak the roster's alphabetical order through the rendered order of anonymous rows.
    expect(project('question').players.map((p) => p.alias)).toEqual(['Aap', 'Ulv', 'Zebra'])
})

test('the mid-quiz leaderboard is anonymous', () => {
    const state = project('reveal')

    expect(state.leaderboard.map((e) => e.alias)).toEqual(['Aap', 'Ulv', 'Zebra'])
    expect(state.leaderboard.map((e) => e.rank)).toEqual([1, 2, 3])
    expect(state.leaderboard.every((e) => e.name === null && e.oid === null)).toBe(true)
})

test('an ended quiz stays masked until the host starts revealing', () => {
    const state = project('ended', 0)

    expect(state.revealStep).toBe(0)
    expect(state.revealMaxStep).toBe(3) // 3 players: podium covers everyone, no "rest" step
    expect(state.leaderboard.every((e) => e.name === null)).toBe(true)
    expect(JSON.stringify(state)).not.toContain('Cecilie')
})

test('the podium reveals third place first, and only third place', () => {
    const state = project('ended', 1)

    const byRank = new Map(state.leaderboard.map((e) => [e.rank, e]))
    expect(byRank.get(3)?.name).toBe('Anna')
    expect(byRank.get(3)?.oid).toBe('oid-anna')
    // The winner must still be a secret at this point.
    expect(byRank.get(2)?.name).toBeNull()
    expect(byRank.get(1)?.name).toBeNull()
    expect(JSON.stringify(state)).not.toContain('Cecilie')
})

test('the podium reveals second then first', () => {
    const second = project('ended', 2)
    const byRankSecond = new Map(second.leaderboard.map((e) => [e.rank, e]))
    expect(byRankSecond.get(2)?.name).toBe('Bjørn')
    expect(byRankSecond.get(1)?.name).toBeNull()

    const first = project('ended', 3)
    const byRankFirst = new Map(first.leaderboard.map((e) => [e.rank, e]))
    expect(byRankFirst.get(1)?.name).toBe('Cecilie')
    expect(first.leaderboard.every((e) => e.name !== null)).toBe(true)
})

test('the reveal step is clamped so an over-eager host cannot push it past the end', () => {
    const state = project('ended', 99)

    expect(state.revealStep).toBe(state.revealMaxStep)
    expect(state.leaderboard.every((e) => e.name !== null)).toBe(true)
})

test('the revealed player list matches the revealed leaderboard', () => {
    const state = project('ended', 1)

    const anna = state.players.find((p) => p.alias === 'Zebra')
    expect(anna?.name).toBe('Anna')
    expect(state.players.filter((p) => p.name !== null)).toHaveLength(1)
})

test('players stored before aliases existed fall back to their name', () => {
    const legacy = { 'dag@nav.no': JSON.stringify({ name: 'Dag', oid: 'oid-dag' }) }
    const state = projectState(session('question'), legacy, {}, {}, {}, null, 0)

    expect(state.players).toHaveLength(1)
    expect(state.players[0].alias).toBe('Dag')
    expect(state.players[0].playerId).toBeTruthy()
})

test('a legacy player keeps the same id across projections', () => {
    // The projection runs on every broadcast. A random fallback id would change between frames,
    // churning React keys and never matching the id the play page handed the client.
    const legacy = { 'dag@nav.no': JSON.stringify({ name: 'Dag', oid: 'oid-dag' }) }
    const first = projectState(session('question'), legacy, {}, {}, {}, null, 0)
    const second = projectState(session('question'), legacy, {}, {}, {}, null, 0)

    expect(first.players[0].playerId).toBe(second.players[0].playerId)
})

test('a corrupt player record is skipped rather than breaking the whole projection', () => {
    const players = { ...PLAYERS, 'broken@nav.no': '{not json' }
    const state = projectState(session('question'), players, {}, SCORES, CORRECT, null, 0)

    expect(state.players.map((p) => p.alias)).toEqual(['Aap', 'Ulv', 'Zebra'])
})
