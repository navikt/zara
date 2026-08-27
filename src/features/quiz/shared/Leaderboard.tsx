'use client'

import { Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import AliasAvatar from '#features/quiz/shared/AliasAvatar'
import { medalFor } from '#features/quiz/shared/medal'
import { cn } from '#lib/tw'
import { LeaderboardEntry } from '#services/quiz/quiz-schema'

type Props = {
    entries: LeaderboardEntry[]
    myPlayerId?: string
    totalPercent?: number
    /** Drop every entry ranked above this, so the ended view can list "the rest" under the podium. */
    startRank?: number
    heading?: string
}

/**
 * The scoreboard. Rows are identified by alias; a player's real name only appears once the host has
 * revealed their place, at which point it renders underneath the alias.
 */
function Leaderboard({ entries, myPlayerId, totalPercent, startRank, heading = 'Ledertavle' }: Props): ReactElement {
    const visible = startRank != null ? entries.filter((entry) => entry.rank >= startRank) : entries

    return (
        <div className="flex flex-col gap-2">
            <Heading level="3" size="small">
                {heading}
            </Heading>
            {visible.map((entry) => (
                <div
                    key={entry.playerId}
                    className={cn('flex items-center justify-between gap-3 p-3 rounded-md bg-ax-bg-raised', {
                        'ring-2 ring-ax-border-accent': entry.playerId === myPlayerId,
                    })}
                >
                    <div className="flex items-center gap-3">
                        <span className="w-8 text-center text-lg tabular-nums">{medalFor(entry.rank)}</span>
                        <AliasAvatar playerId={entry.playerId} alias={entry.alias} name={entry.name} oid={entry.oid} />
                        <div className="flex flex-col">
                            <span className="font-semibold">{entry.alias}</span>
                            {entry.name != null && (
                                <span className="text-sm text-ax-text-neutral-subtle">{entry.name}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                        <span className="text-ax-text-neutral-subtle">{entry.percent}% riktig</span>
                        <span className="font-bold tabular-nums">{entry.points} poeng</span>
                    </div>
                </div>
            ))}
            {totalPercent != null && (
                <div className="flex items-center justify-between gap-3 px-3 pt-2 border-t border-ax-border-neutral-subtle">
                    <span className="font-semibold">Lagets totalscore</span>
                    <span className="font-bold tabular-nums">{totalPercent}% riktig</span>
                </div>
            )}
        </div>
    )
}

export default Leaderboard
