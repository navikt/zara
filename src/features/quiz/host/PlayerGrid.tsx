'use client'

import { BodyShort, Tag } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import AliasAvatar from '#features/quiz/shared/AliasAvatar'
import { PlayerPresence } from '#services/quiz/quiz-schema'

type Props = {
    players: PlayerPresence[]
    /** Show a "answered / waiting" badge under each player (only meaningful during a question). */
    showAnswered: boolean
}

/**
 * The players once the quiz has STARTED — aliases only. The lobby uses
 * {@link ../shared/LobbyRoster} instead, which shows real names.
 */
function PlayerGrid({ players, showAnswered }: Props): ReactElement {
    if (players.length === 0) {
        return <BodyShort className="italic text-ax-text-neutral-subtle">Ingen spillere har blitt med ennå.</BodyShort>
    }

    return (
        <div className="flex flex-wrap gap-3">
            {players.map((player) => (
                <div key={player.playerId} className="flex flex-col items-center gap-1 w-20">
                    <AliasAvatar playerId={player.playerId} alias={player.alias} name={player.name} oid={player.oid} />
                    <span className="text-xs text-center truncate w-full" title={player.alias}>
                        {player.alias}
                    </span>
                    {player.name != null && (
                        <span className="text-xs text-center truncate w-full font-semibold" title={player.name}>
                            {player.name}
                        </span>
                    )}
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
