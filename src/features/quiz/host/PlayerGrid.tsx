'use client'

import { BodyShort, Tag } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import Avatar from '#components/live-view/Avatar'
import { PlayerPresence } from '#services/quiz/quiz-schema'

type Props = {
    players: PlayerPresence[]
    /** Show a "answered / waiting" badge under each player (only meaningful during a question). */
    showAnswered: boolean
}

function PlayerGrid({ players, showAnswered }: Props): ReactElement {
    if (players.length === 0) {
        return <BodyShort className="italic text-ax-text-neutral-subtle">Ingen spillere har blitt med ennå.</BodyShort>
    }

    return (
        <div className="flex flex-wrap gap-3">
            {players.map((player) => (
                <div key={player.userId} className="flex flex-col items-center gap-1 w-20">
                    <Avatar id={player.oid} name={player.name} />
                    <span className="text-xs text-center truncate w-full" title={player.name}>
                        {player.name}
                    </span>
                    {showAnswered &&
                        (player.answered ? (
                            <Tag variant="success" size="xsmall">
                                Svart
                            </Tag>
                        ) : (
                            <Tag variant="neutral" size="xsmall">
                                Venter
                            </Tag>
                        ))}
                </div>
            ))}
        </div>
    )
}

export default PlayerGrid
