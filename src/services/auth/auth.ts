import { getToken, parseAzureUserToken, validateToken } from '@navikt/oasis'
import { headers } from 'next/headers'
import { unauthorized } from 'next/navigation'

import { bundledEnv } from '@lib/env'
import { User } from '@services/auth/user'
import { LocalMockUser } from '@services/auth/mock'
import { userHasAccess, ZaraFeatures } from '@services/auth/access-control'

/**
 * Throws auth interrupt if token is missing or invalid
 */
export async function validateUserSession(requiredAccess: 'ANY' | ZaraFeatures | ZaraFeatures[]): Promise<User> {
    if (bundledEnv.runtimeEnv === 'local') return LocalMockUser

    const token = getToken(await headers())
    if (!token) unauthorized()

    const validation = await validateToken(token)
    if (!validation.ok) unauthorized()

    const info = await userInfo(token)
    if (!info) unauthorized()

    const hasAccess = userHasAccess(requiredAccess)
    if (!hasAccess) unauthorized()

    return {
        oid: info.oid,
        name: info.name,
        userId: info.userId,
        groups: info.groups,
    }
}

export async function userInfo(token?: string): Promise<User | null> {
    if (bundledEnv.runtimeEnv === 'local') return LocalMockUser

    const _token = token ?? getToken(await headers())
    if (!_token) return null

    const parsed = parseAzureUserToken(_token)
    if (!parsed.ok) return null

    return {
        oid: parsed.oid,
        name: parsed.name,
        userId: parsed.preferred_username,
        groups: parsed.groups ?? [],
    }
}
