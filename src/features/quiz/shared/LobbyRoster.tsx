'use client'

import { BodyShort } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import Avatar from '#components/live-view/Avatar'
import { LobbyPlayer } from '#services/quiz/quiz-schema'

type Props = {
    players: LobbyPlayer[]
}

/**
 * Who is in the room, by real name — the LOBBY view. Once the quiz starts the server stops sending
 * this list entirely and {@link ../host/PlayerGrid} takes over with aliases.
 */
function LobbyRoster({ players }: Props): ReactElement {
    if (players.length === 0) {
        return <BodyShort className="italic text-ax-text-neutral-subtle">Ingen spillere har blitt med ennå.</BodyShort>
    }

    return (
        <div className="flex flex-wrap gap-3">
            {players.map((player) => (
                <div key={player.oid} className="flex flex-col items-center gap-1 w-20">
                    <Avatar id={player.oid} name={player.name} />
                    <span className="text-xs text-center truncate w-full" title={player.name}>
                        {player.name}
                    </span>
                </div>
            ))}
        </div>
    )
}

export default LobbyRoster
