'use server'

import { logger } from '@navikt/next-logger'
import { redirect } from 'next/navigation'

import { encryptQueryParam } from '#lib/crypto/query-param-encryption'
import { validateUserSession } from '#services/auth/auth'

export async function searchPerson(formData: FormData): Promise<void> {
    await validateUserSession('TEAM_MEMBER')

    const ident = formData.get('ident')
    if (typeof ident !== 'string' || ident.length <= 3) {
        redirect('/vakt/person-lookup')
    }

    const path = formData.get('path')
    if (typeof path !== 'string' || !path.startsWith('/vakt/')) {
        logger.error('Invalid path provided in searchPerson action, is the form configured correctly?')
        redirect('/vakt/person-lookup')
    }

    const encryptedIdent = encryptQueryParam(ident)
    redirect(`${path}?ident=${encodeURIComponent(encryptedIdent)}`)
}
