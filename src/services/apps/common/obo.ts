import { getToken, requestOboToken } from '@navikt/oasis'
import { headers } from 'next/headers'

import { bundledEnv } from '#lib/env'
import { raise } from '#lib/ts'

export async function getOboToken(app: string): Promise<string> {
    const token = getToken(await headers())
    if (!token) throw new Error('No token found')

    if (bundledEnv.runtimeEnv === 'local') {
        raise('Why are you trying to exchange a token in local environment?')
    }

    const tokenSet = await requestOboToken(token, `api://${bundledEnv.runtimeEnv}.tsm.${app}/.default`)
    if (!tokenSet.ok) {
        throw new Error(`Unable to exchange OBO token: ${tokenSet.error.message}`, { cause: tokenSet.error })
    }

    return tokenSet.token
}
