import { getToken, parseAzureUserToken } from '@navikt/oasis'
import { headers } from 'next/headers'

export async function getLoggedInUser() {
    if (process.env.NODE_ENV === 'development') {
        return {
            name: 'Test Bruker',
            email: 'test.bruker@nav.no',
        }
    }

    const token = getToken(await headers())
    if (!token) return null

    try {
        const parsedToken = parseAzureUserToken(token)
        if (!parsedToken.ok) {
            console.error(`Unable to parse token: ${parsedToken.error}`)
            return null
        }

        return {
            name: parsedToken.name,
            email: parsedToken.NAVident,
        }
    } catch (e) {
        console.error('Failed to introspect token', e)
        return null
    }
}
