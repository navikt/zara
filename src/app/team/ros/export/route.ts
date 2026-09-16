import { NextResponse } from 'next/server'

import { validateUserSession } from '#services/auth/auth'
import { getTryggnokRosResult } from '#services/ros/tryggnok-service'

export async function GET(): Promise<NextResponse> {
    await validateUserSession('TEAM_MEMBER')

    const result = await getTryggnokRosResult()
    if (result == null) {
        return NextResponse.json({ error: 'Ingen ROS-data er eksportert enda.' }, { status: 404 })
    }

    return NextResponse.json(result)
}
