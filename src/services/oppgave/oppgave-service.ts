import { logger } from '@navikt/next-logger'

import { bundledEnv } from '#lib/env'
import { raise } from '#lib/ts'
import { getOboToken } from '#services/apps/common/obo'
import { createOppgaveMock } from '#services/oppgave/oppgave-mock-data'
import { Oppgave, OppgaveSchema } from '#services/oppgave/oppgave-schema'

const TSM_OPPGAVE_URL = 'http://tsm-oppgave'

export const oppgaveApiService = {
    getOppgaverByIdent: async (ident: string): Promise<Oppgave[]> => {
        if (bundledEnv.runtimeEnv === 'local') {
            logger.warn('Running in local or demo environment, returning mocked Oppgave data')
            return createOppgaveMock()
        }

        const oboToken = await getOboToken('tsm-oppgave')

        const result = await fetch(`${TSM_OPPGAVE_URL}/api/oppgaver`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}`, ident: ident },
        })

        if (!result.ok) {
            raise(`Failed to fetch oppgaver from tsm-oppgave: ${result.status} ${result.statusText}`)
        }

        const data = await result.json()
        return data.map((item: unknown) => OppgaveSchema.parse(item))
    },
}
