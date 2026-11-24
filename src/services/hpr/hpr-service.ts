import { logger } from '@navikt/next-logger'

import { bundledEnv } from '#lib/env'
import { ApiFetchErrors, fetchInternalAPI } from '#services/shared/api-fetcher'

import { createHprPersonMock } from './hpr-mock-data'
import { Behandler, BehandlerSchema } from './hpr-schema'

export const hprApiService = {
    getHprPerson: async (hpr: string): Promise<Behandler | ApiFetchErrors<'HPR_NOT_FOUND'>> => {
        if (bundledEnv.runtimeEnv === 'local') {
            logger.warn('Running locally, returning mocked HPR data')
            return createHprPersonMock(hpr)
        }

        return fetchInternalAPI({
            api: 'tsm-behandler',
            path: '/api/behandler/search',
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'HPR', id: hpr }),
            responseSchema: BehandlerSchema,
            onApiError: (response) => {
                if (response.status === 404) {
                    return 'HPR_NOT_FOUND'
                }
            },
        })
    },
}
