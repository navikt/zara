import { getToken, requestOboToken } from '@navikt/oasis'
import { headers } from 'next/headers'

export async function getMsOboToken(token?: string): Promise<string> {
    const _token = token ?? getToken(await headers())
    if (!_token) throw new Error('No _token found')

    const tokenSet = await requestOboToken(_token, 'https://graph.microsoft.com/.default')
    if (!tokenSet.ok) {
        throw new Error(`Unable to exchange OBO token: ${tokenSet.error.message}`, { cause: tokenSet.error })
    }

    return tokenSet.token
}
