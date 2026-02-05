import { getToken, parseAzureUserToken, validateToken } from '@navikt/oasis'
import { headers } from 'next/headers'
import { unauthorized } from 'next/navigation'

import { bundledEnv } from '@lib/env'
import { User } from '@services/auth/user'

/**
 * Throws auth interrupt if token is missing or invalid
 */
export async function validateUserSession(): Promise<User> {
    if (bundledEnv.runtimeEnv === 'local') {
        return { name: 'Låccy McDevssøn', userId: 'loccy@example.com', oid: 'fake-dev-oid' }
    }

    const token = getToken(await headers())
    if (!token) unauthorized()

    const validation = await validateToken(token)
    if (!validation.ok) unauthorized()

    const info = await userInfo(token)
    if (!info) unauthorized()

    return {
        oid: info.oid,
        name: info.name,
        userId: info.userId,
    }
}

export async function userInfo(token?: string): Promise<User | null> {
    if (bundledEnv.runtimeEnv === 'local') {
        return { name: 'Låccy McDevssøn', userId: 'loccy@example.com', oid: 'fake-dev-oid' }
    }

    const _token = token ?? getToken(await headers())
    if (!_token) return null

    const parsed = parseAzureUserToken(_token)
    if (!parsed.ok) return null

    return {
        oid: parsed.oid,
        name: parsed.name,
        userId: parsed.preferred_username,
    }
}
