import React, { ReactElement } from 'react'

import HostSession from '#features/quiz/host/HostSession'
import { validateUserSession } from '#services/auth/auth'

async function Page({ params }: PageProps<'/quiz/host/[sessionId]'>): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')
    const { sessionId } = await params

    return <HostSession sessionId={sessionId} meUserId={user.userId} />
}

export default Page
