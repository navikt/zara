import { getToken, parseAzureUserToken } from '@navikt/oasis'
import { headers } from 'next/headers'
import { logger } from '@navikt/next-logger'

type LoggedInUser = {
    name: string
    email: string
}

export async function getLoggedInUser(): Promise<LoggedInUser | null> {
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
            logger.error(`Unable to parse token: ${parsedToken.error}`)
            return null
        }

        return {
            name: parsedToken.name,
            email: parsedToken.NAVident,
        }
    } catch (e) {
        logger.error(new Error('Failed to introspect token', { cause: e }))
        return null
    }
}
