import { Heading } from '@navikt/ds-react'
import { notFound, redirect } from 'next/navigation'
import React, { ReactElement } from 'react'

import JoinForm from '#features/quiz/join/JoinForm'
import { validateUserSession } from '#services/auth/auth'
import { getSession, getSessionPlayer } from '#services/quiz/quiz-session-service'

/**
 * Where a player picks the alias they'll be known by for this session. Joining is a mutation, so it
 * happens in the form's action rather than here — this page only decides whether the alias is still
 * needed.
 */
async function Page({ params }: PageProps<'/quiz/join/[sessionId]'>): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')
    const { sessionId } = await params

    const session = await getSession(sessionId)
    if (!session || session.status === 'ended') notFound()

    // Already joined (a refresh, or a second tab): the alias is fixed, so go straight to playing.
    const existing = await getSessionPlayer(sessionId, user.userId)
    if (existing) redirect(`/quiz/play/${sessionId}`)

    return (
        <div className="flex flex-col gap-6 py-6">
            <div>
                <Heading level="1" size="large">
                    {session.quizTitle}
                </Heading>
                <Heading level="2" size="small" className="text-ax-text-neutral-subtle">
                    Vert: {session.hostName}
                </Heading>
            </div>
            <JoinForm sessionId={sessionId} started={session.status !== 'lobby'} />
        </div>
    )
}

export default Page
