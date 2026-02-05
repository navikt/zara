import { getToken } from '@navikt/oasis'
import { headers } from 'next/headers'

import { userInfo } from '@services/auth/auth'

export async function GET(): Promise<Response> {
    const headerStore = await headers()
    const token = getToken(headerStore)
    const user = await userInfo()

    return Response.json(
        {
            token,
            headers: headerStore.entries().toArray(),
            user,
        },
        { status: 200 },
    )
}
