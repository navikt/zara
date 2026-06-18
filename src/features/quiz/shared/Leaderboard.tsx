'use client'

import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'

import { cn } from '@lib/tw'
import { LeaderboardEntry } from '@services/quiz/quiz-schema'
import { medalFor } from '@features/quiz/shared/medal'

type Props = {
    entries: LeaderboardEntry[]
    meUserId?: string
    totalPercent?: number
}

function Leaderboard({ entries, meUserId, totalPercent }: Props): ReactElement {
    return (
        <div className="flex flex-col gap-2">
            <Heading level="3" size="small">
                Ledertavle
            </Heading>
            {entries.map((entry) => (
                <div
                    key={entry.userId}
                    className={cn('flex items-center justify-between gap-3 p-3 rounded-md bg-ax-bg-raised', {
                        'ring-2 ring-ax-border-accent': entry.userId === meUserId,
                    })}
                >
                    <div className="flex items-center gap-3">
                        <span className="w-8 text-center text-lg tabular-nums">{medalFor(entry.rank)}</span>
                        <span className="font-semibold">{entry.name}</span>
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
