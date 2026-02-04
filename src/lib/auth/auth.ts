import { getToken, validateToken } from '@navikt/oasis'
import { headers } from 'next/headers'
import { unauthorized } from 'next/navigation'

import { bundledEnv } from '@lib/env'

/**
 * Throws auth interrupt if token is missing or invalid
 */
export async function validateTokenInServerAction(): Promise<void> {
    if (bundledEnv.runtimeEnv === 'local') return

    const token = getToken(await headers())
    if (!token) unauthorized()

    const validation = await validateToken(token)
    if (!validation.ok) unauthorized()
}
