import { getToken, requestOboToken } from '@navikt/oasis'
import { headers } from 'next/headers'

export async function getMsOboToken(): Promise<string> {
    const token = getToken(await headers())
    if (!token) throw new Error('No token found')

    const tokenSet = await requestOboToken(token, 'https://graph.microsoft.com/.default')
    if (!tokenSet.ok) {
        throw new Error(`Unable to exchange OBO token: ${tokenSet.error.message}`, { cause: tokenSet.error })
    }

    return tokenSet.token
}
