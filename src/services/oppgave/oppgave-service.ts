import { logger } from '@navikt/next-logger'

import { bundledEnv } from '#lib/env'
import { ApiFetchErrors, fetchInternalAPI } from '#services/shared/api-fetcher'

import { createOppgaveMock } from './oppgave-mock-data'
import { Oppgave, OppgaveSchema } from './oppgave-schema'

export const oppgaveApiService = {
    getOppgaverByIdent: async (ident: string): Promise<Oppgave[] | ApiFetchErrors<'OPPGAVE_NOT_FOUND'>> => {
        if (bundledEnv.runtimeEnv === 'local') {
            logger.warn('Running in local or demo environment, returning mocked Oppgave data')
            return createOppgaveMock()
        }

        return fetchInternalAPI({
            api: 'tsm-oppgave',
            path: `/api/oppgaver/`,
            method: 'GET',
            headers: { ident: ident },
            responseSchema: OppgaveSchema,
            onApiError: (response) => {
                if (response.status === 404) {
                    logger.warn(`No oppgaver found for person with ident (${response.status} ${response.statusText}`)

                    return 'OPPGAVE_NOT_FOUND'
                }
            },
        })
    },
}
