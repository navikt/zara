import { logger } from '@navikt/next-logger'
import { NextRequest } from 'next/server'
import { notFound } from 'next/navigation'

import { getMsOboToken } from '@services/entra/ms-graph'
import { bundledEnv } from '@lib/env'

function handler(method: 'GET' | 'POST') {
    return async (request: NextRequest): Promise<Response> => {
        if (bundledEnv.runtimeEnv === 'prod-gcp') notFound()

        const path = request.nextUrl.pathname.replace('/api/debug/ms', '')

        try {
            const obo = await getMsOboToken()

            return fetch(`https://graph.microsoft.com/${path}`, {
                method: method,
                headers: { Authorization: `Bearer ${obo}` },
            })
        } catch (e) {
            logger.error(e)
            return new Response(undefined, { status: 404 })
        }
    }
}

export const GET = handler('GET')
export const POST = handler('POST')
