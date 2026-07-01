'use client'

import { useMemo, useSyncExternalStore } from 'react'

import { ClientSessionState, QuizEvent } from '#services/quiz/quiz-schema'

type SessionStore = {
    subscribe: (onChange: () => void) => () => void
    getSnapshot: () => ClientSessionState | null
}

/**
 * A per-session external store backed by the SSE stream. The server pushes the full
 * {@link ClientSessionState} on connect and on every change; the store keeps the latest and
 * notifies React through {@link useSyncExternalStore} — so no effects live in the component tree.
 */
function createSessionStore(sessionId: string): SessionStore {
    let state: ClientSessionState | null = null
    const listeners = new Set<() => void>()
    let source: EventSource | null = null

    return {
        subscribe(onChange) {
            listeners.add(onChange)
            if (source == null) {
                source = new EventSource(`/quiz/session/${sessionId}/live`)
                source.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data) as QuizEvent
                        if (payload.type === 'state') {
                            state = payload.state
                            listeners.forEach((notify) => notify())
                        }
                    } catch {
                        // Ignore malformed frames; the next snapshot recovers the UI.
                    }
                }
            }
            return () => {
                listeners.delete(onChange)
                if (listeners.size === 0) {
                    source?.close()
                    source = null
                    state = null
                }
            }
        },
        getSnapshot: () => state,
    }
}

/** Subscribes to a live quiz session's SSE stream and returns the latest projected state. */
export function useQuizSession(sessionId: string): ClientSessionState | null {
    const store = useMemo(() => createSessionStore(sessionId), [sessionId])
    return useSyncExternalStore(store.subscribe, store.getSnapshot, () => null)
}
