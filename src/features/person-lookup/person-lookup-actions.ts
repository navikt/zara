'use server'

import { redirect } from 'next/navigation'

import { validateUserSession } from '@services/auth/auth'
import { encryptQueryParam } from '@lib/crypto/query-param-encryption'

export async function searchPerson(formData: FormData): Promise<void> {
    await validateUserSession('TEAM_MEMBER')

    const ident = formData.get('ident')
    if (typeof ident !== 'string' || ident.length <= 3) {
        redirect('/vakt/person-lookup')
    }

    const encryptedIdent = encryptQueryParam(ident)
    redirect(`/vakt/person-lookup?ident=${encodeURIComponent(encryptedIdent)}`)
}
