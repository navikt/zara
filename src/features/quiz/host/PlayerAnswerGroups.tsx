'use client'

import { CheckmarkCircleIcon, MinusCircleIcon, XMarkOctagonIcon } from '@navikt/aksel-icons'
import { BodyShort, Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import PlayerGrid from '#features/quiz/host/PlayerGrid'
import { cn } from '#lib/tw'
import { PlayerPresence, RevealResult } from '#services/quiz/quiz-schema'

type Props = {
    players: PlayerPresence[]
    results: RevealResult[]
}

function PlayerAnswerGroups({ players, results }: Props): ReactElement {
    const resultsByPlayer = new Map(results.map((result) => [result.playerId, result]))
    const groups = [
        {
            key: 'correct',
            label: 'Riktig',
            icon: CheckmarkCircleIcon,
            style: 'border-ax-border-success bg-ax-bg-success-moderate',
        },
        {
            key: 'partial',
            label: 'Delvis riktig',
            icon: MinusCircleIcon,
            style: 'border-ax-border-info bg-ax-bg-info-moderate',
        },
        {
            key: 'wrong',
            label: 'Feil',
            icon: XMarkOctagonIcon,
            style: 'border-ax-border-danger bg-ax-bg-danger-moderate',
        },
        {
            key: 'unanswered',
            label: 'Ikke svart',
            icon: MinusCircleIcon,
            style: 'border-ax-border-neutral-subtle bg-ax-bg-neutral-moderate',
        },
    ] as const
    const grouped = Map.groupBy(players, (player) => {
        const result = resultsByPlayer.get(player.playerId)
        if (!result?.answer) return 'unanswered'
        if (result.correct) return 'correct'
        return result.accuracy > 0 ? 'partial' : 'wrong'
    })

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {groups.map((group) => {
                const members = grouped.get(group.key) ?? []
                if (members.length === 0 && group.key !== 'correct' && group.key !== 'wrong') return null
                const Icon = group.icon
                return (
                    <section
                        key={group.key}
                        aria-label={`${group.label}: ${members.length} spillere`}
                        className={cn('rounded-md border-2 p-4 flex flex-col gap-4', group.style)}
                    >
                        <div className="flex items-center justify-between gap-3">
                            <Heading level="3" size="small" className="flex items-center gap-2">
                                <Icon aria-hidden />
                                {group.label}
                            </Heading>
                            <span className="text-2xl font-bold tabular-nums">{members.length}</span>
                        </div>
                        {members.length > 0 ? (
                            <PlayerGrid players={members} showAnswered={false} />
                        ) : (
                            <BodyShort size="small">Ingen spillere</BodyShort>
                        )}
                    </section>
                )
            })}
        </div>
    )
}

export default PlayerAnswerGroups
