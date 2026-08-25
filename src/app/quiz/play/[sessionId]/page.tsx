import { redirect } from 'next/navigation'
import React, { ReactElement } from 'react'

import PlaySession from '#features/quiz/play/PlaySession'
import { validateUserSession } from '#services/auth/auth'
import { getSessionPlayer } from '#services/quiz/quiz-session-service'

async function Page({ params }: PageProps<'/quiz/play/[sessionId]'>): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')
    const { sessionId } = await params

    // Joining is where the alias is picked, so anyone who lands here without a player record (a
    // deep link, say) has to go pick one first.
    const player = await getSessionPlayer(sessionId, user.userId)
    if (!player) redirect(`/quiz/join/${sessionId}`)

    // The alias is passed as a prop rather than read off the live state: it never travels in the
    // broadcast alongside a real name, and this way the player can still see their own.
    return <PlaySession sessionId={sessionId} myPlayerId={player.playerId} myAlias={player.alias} />
}

export default Page
