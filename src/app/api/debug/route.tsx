import { getToken } from '@navikt/oasis'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'

import { bundledEnv } from '@lib/env'

export async function GET(): Promise<Response> {
    if (bundledEnv.runtimeEnv === 'prod-gcp') notFound()

    const headerStore = await headers()
    const token = getToken(headerStore)

    return Response.json(
        {
            token,
            headers: headerStore.entries().toArray(),
        },
        { status: 200 },
    )
}
