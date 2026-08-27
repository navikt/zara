'use client'

import { useMemo, useSyncExternalStore } from 'react'

import { ClientSessionState, QuizEvent } from '#services/quiz/quiz-schema'

/** Whether the live stream is currently delivering updates. */
export type ConnectionStatus = 'connecting' | 'open' | 'offline'

export type QuizSessionSnapshot = {
    /** The last state we received. Kept across a drop, so the UI doesn't blank out mid-quiz. */
    state: ClientSessionState | null
    connection: ConnectionStatus
    /** Consecutive failed connection attempts; a stuck count means reconnecting won't fix it. */
    failedAttempts: number
}

const INITIAL: QuizSessionSnapshot = { state: null, connection: 'connecting', failedAttempts: 0 }

const RETRY_DELAYS_MS = [1_000, 2_000, 5_000, 10_000, 30_000]

type SessionStore = {
    subscribe: (onChange: () => void) => () => void
    getSnapshot: () => QuizSessionSnapshot
    getServerSnapshot: () => QuizSessionSnapshot
}

/**
 * A per-session external store backed by the SSE stream. The server pushes the full
 * {@link ClientSessionState} on connect and on every change; the store keeps the latest and
 * notifies React through {@link useSyncExternalStore} — so no effects live in the component tree.
 *
 * Because every frame is the complete state rather than a delta, reconnecting needs no catch-up
 * logic: the route replays a fresh snapshot on connect and the UI simply snaps to it.
 */
function createSessionStore(sessionId: string): SessionStore {
    // useSyncExternalStore compares snapshots by reference, so this is only ever REPLACED when
    // something actually changed. Never rebuild it inside getSnapshot — that loops forever.
    let snapshot: QuizSessionSnapshot = INITIAL
    const listeners = new Set<() => void>()
    let source: EventSource | null = null
    let retryTimer: ReturnType<typeof setTimeout> | null = null
    let stopped = false

    const emit = (next: Partial<QuizSessionSnapshot>): void => {
        snapshot = { ...snapshot, ...next }
        listeners.forEach((notify) => notify())
    }

    const scheduleRetry = (): void => {
        if (stopped || retryTimer != null) return
        const delay = RETRY_DELAYS_MS[Math.min(snapshot.failedAttempts, RETRY_DELAYS_MS.length - 1)]
        retryTimer = setTimeout(() => {
            retryTimer = null
            connect()
        }, delay)
    }

    function connect(): void {
        if (stopped) return
        const eventSource = new EventSource(`/quiz/session/${sessionId}/live`)
        source = eventSource

        eventSource.onopen = () => emit({ connection: 'open', failedAttempts: 0 })

        eventSource.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data) as QuizEvent
                if (payload.type === 'state') {
                    emit({ state: payload.state, connection: 'open', failedAttempts: 0 })
                }
            } catch {
                // Ignore malformed frames; the next snapshot recovers the UI.
            }
        }

        eventSource.onerror = () => {
            // EventSource only auto-retries transport blips. On a non-2xx — an expired token being
            // the likely one, since sessions can run for hours — it closes for good. Without our
            // own retry the player would be stranded on a frozen but entirely plausible screen,
            // countdown still ticking, with no clue anything broke.
            if (eventSource.readyState === EventSource.CLOSED) {
                eventSource.close()
                if (source === eventSource) source = null
                emit({ connection: 'offline', failedAttempts: snapshot.failedAttempts + 1 })
                scheduleRetry()
                return
            }
            // Still CONNECTING: the browser is handling the retry, just surface that we're down.
            emit({ connection: 'offline' })
        }
    }

    return {
        subscribe(onChange) {
            listeners.add(onChange)
            if (source == null && retryTimer == null) {
                stopped = false
                connect()
            }
            return () => {
                listeners.delete(onChange)
                if (listeners.size === 0) {
                    stopped = true
                    if (retryTimer != null) clearTimeout(retryTimer)
                    retryTimer = null
                    source?.close()
                    source = null
                    snapshot = INITIAL
                }
            }
        },
        getSnapshot: () => snapshot,
        getServerSnapshot: () => INITIAL,
    }
}

/** Subscribes to a live quiz session's SSE stream and returns the latest projected state. */
export function useQuizSession(sessionId: string): QuizSessionSnapshot {
    const store = useMemo(() => createSessionStore(sessionId), [sessionId])
    return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)
}
