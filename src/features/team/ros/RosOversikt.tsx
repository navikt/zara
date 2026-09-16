import React, { ReactElement } from 'react'

import { validateUserSession } from '#services/auth/auth'

export async function RosOversikt(): Promise<ReactElement> {
    await validateUserSession('TEAM_MEMBER')

    return <div>Oversiktsliste kommer...</div>
}
