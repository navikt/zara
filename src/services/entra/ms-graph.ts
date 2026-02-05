import { headers } from 'next/headers'
import { getToken, requestOboToken } from '@navikt/oasis'

export async function getMsOboToken(): Promise<string> {
    const token = getToken(await headers())
    if (!token) throw new Error('No token found')

    const tokenSet = await requestOboToken(token, 'https://graph.microsoft.com/.default')
    if (!tokenSet.ok) {
        throw new Error(`Unable to exchange OBO token: ${tokenSet.error.message}`, { cause: tokenSet.error })
    }

    return tokenSet.token
}
