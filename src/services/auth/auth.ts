import { getToken, parseAzureUserToken, validateToken } from '@navikt/oasis'
import { headers } from 'next/headers'
import { unauthorized } from 'next/navigation'

import { bundledEnv } from '#lib/env'
import { userHasAccess, ZaraFeatures } from '#services/auth/access-control'
import { LocalMockUser } from '#services/auth/mock'
import { User } from '#services/auth/user'

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

    const hasAccess = await userHasAccess(requiredAccess)
    if (!hasAccess) unauthorized()

    return {
        oid: info.oid,
        name: info.name,
        userId: info.userId,
        navIdent: info.navIdent,
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
        name: parsed.name,
        /**
         * The users email
         */
        userId: parsed.preferred_username,
        /**
         * Entra's "immutable identifier for the requestor", used to display the users avatar
         */
        oid: parsed.oid,
        /**
         * Users navIdent, for example: O628282
         */
        navIdent: parsed.NAVident,
        groups: parsed.groups ?? [],
    }
}
