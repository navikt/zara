import { logger } from '@navikt/next-logger'

import { ApiFetchErrors, fetchInternalAPI } from '@services/shared/api-fetcher'
import { bundledEnv } from '@lib/env'

import { createHprPersonMock } from './hpr-mock-data'
import { Behandler, BehandlerSchema } from './hpr-schema'

export const hprApiService = {
    getHprPerson: async (hpr: string): Promise<Behandler | ApiFetchErrors<'HPR_NOT_FOUND'>> => {
        if (bundledEnv.runtimeEnv === 'local') {
            logger.warn('Running in local or demo environment, returning mocked PDL data')
            return createHprPersonMock(hpr)
        }

        return fetchInternalAPI({
            api: 'syfohelsenettproxy',
            path: `/api/v2/behandlerMedHprNummer`,
            method: 'GET',
            headers: { HprNummer: hpr },
            responseSchema: BehandlerSchema,
            onApiError: (response) => {
                if (response.status === 404) {
                    logger.error(
                        `Unable to fetch person with hpr ${hpr}  from hpr-proxy (${response.status} ${response.statusText}`,
                    )

                    return 'HPR_NOT_FOUND'
                }
            },
        })
    },
}
