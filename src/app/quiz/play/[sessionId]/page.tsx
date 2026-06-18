import React, { ReactElement } from 'react'

import { validateUserSession } from '@services/auth/auth'
import PlaySession from '@features/quiz/play/PlaySession'

async function Page({ params }: PageProps<'/quiz/play/[sessionId]'>): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')
    const { sessionId } = await params

    // Pure read: the caller has already been joined by the "Bli med" action that routed them here.
    return <PlaySession sessionId={sessionId} meUserId={user.userId} />
}

export default Page
