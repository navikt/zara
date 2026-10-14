'use server'

import { createHmac } from 'node:crypto'

import { getServerEnv } from '#lib/env'
import { validateUserSession } from '#services/auth/auth'

type HashIdentsResult =
    | { error: string; results?: never }
    | { error?: never; results: { ident: string; sha: string }[] }

export async function hashIdents(input: string): Promise<HashIdentsResult> {
    await validateUserSession('TEAM_MEMBER')

    const idents = input
        .split(/\r\n|\r|\n/)
        .map((line) => line.trim().replace(/,+$/, '').trim())
        .filter((line) => line.length > 0)

    if (idents.length === 0) {
        return { error: 'Skriv inn minst én ident.' }
    }

    if (idents.some((ident) => !/^\d{11}$/.test(ident))) {
        return { error: 'Hver ident må bestå av 11 siffer. Skriv én ident per linje.' }
    }

    const { tsmIdentHashSecret } = getServerEnv()

    return {
        results: idents.map((ident) => ({
            ident,
            sha: createHmac('sha256', tsmIdentHashSecret).update(ident).digest('hex'),
        })),
    }
}
