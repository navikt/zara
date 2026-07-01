'use client'

import { BodyShort, Button, Heading, Tag } from '@navikt/ds-react'
import Link from 'next/link'
import React, { ReactElement, useState, useSyncExternalStore } from 'react'

import { joinAndEnter } from '#features/quiz/play-actions'
import { ActiveSession, LobbyEvent, SessionStatus } from '#services/quiz/quiz-schema'

type Props = {
    sessions: ActiveSession[]
    meUserId: string
}

const STATUS_TAG: Record<SessionStatus, { label: string; variant: 'success' | 'info' | 'neutral' }> = {
    lobby: { label: 'Åpen lobby', variant: 'success' },
    question: { label: 'Pågår', variant: 'info' },
    reveal: { label: 'Pågår', variant: 'info' },
    ended: { label: 'Ferdig', variant: 'neutral' },
}

type LobbyStore = {
    subscribe: (onChange: () => void) => () => void
    getSnapshot: () => ActiveSession[]
    getServerSnapshot: () => ActiveSession[]
}

/** External store backed by the lobby SSE stream; seeded with the server-rendered list. */
function createLobbyStore(initial: ActiveSession[]): LobbyStore {
    let sessions = initial
    const listeners = new Set<() => void>()
    let source: EventSource | null = null

    return {
        subscribe(onChange) {
            listeners.add(onChange)
            if (source == null) {
                source = new EventSource('/quiz/lobby/live')
                source.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data) as LobbyEvent
                        if (payload.type === 'sessions') {
                            sessions = payload.sessions
                            listeners.forEach((notify) => notify())
                        }
                    } catch {
                        // Ignore malformed frames; the next snapshot recovers the list.
                    }
                }
            }
            return () => {
                listeners.delete(onChange)
                if (listeners.size === 0) {
                    source?.close()
                    source = null
                }
            }
        },
        getSnapshot: () => sessions,
        getServerSnapshot: () => initial,
    }
}

function ActiveSessions({ sessions, meUserId }: Props): ReactElement {
    const [store] = useState(() => createLobbyStore(sessions))
    const live = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot)

    if (live.length === 0) {
        return (
            <BodyShort className="italic text-ax-text-neutral-subtle">Ingen aktive quiz-sesjoner akkurat nå.</BodyShort>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {live.map((session) => {
                const tag = STATUS_TAG[session.status]
                const iAmHost = session.hostUserId === meUserId
                return (
                    <div
                        key={session.sessionId}
                        className="flex flex-wrap items-center justify-between gap-3 bg-ax-bg-raised p-4 rounded-md"
                    >
                        <div>
                            <Heading level="3" size="small" className="flex items-center gap-2">
                                {session.quizTitle}
                                <Tag variant={tag.variant} size="xsmall">
                                    {tag.label}
                                </Tag>
                                {iAmHost && (
                                    <Tag variant="alt1" size="xsmall">
                                        Du er vert
                                    </Tag>
                                )}
                            </Heading>
                            <BodyShort size="small" className="text-ax-text-neutral-subtle">
                                Vert: {session.hostName} · {session.playerCount} spillere
                            </BodyShort>
                        </div>
                        {iAmHost ? (
                            <Button as={Link} href={`/quiz/host/${session.sessionId}`} size="small">
                                Åpne vert-visning
                            </Button>
                        ) : (
                            <form action={joinAndEnter.bind(null, session.sessionId)}>
                                <Button type="submit" size="small" variant="secondary">
                                    Bli med
                                </Button>
                            </form>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

export default ActiveSessions
