import * as R from 'remeda'
import { logger } from '@navikt/next-logger'

import { bundledEnv } from '@lib/env'
import { getOboToken } from '@services/apps/common/obo'
import { raise } from '@lib/ts'
import { mockHistory } from '@services/apps/regulus-maximus/mock-data'
import { SykmeldingRecord } from '@services/apps/regulus-maximus/types'

const REGULUS_MAXIMUS_ADMIN = 'http://regulus-maximus/internal/admin'

export async function getRegulusMaximusSykmeldingshistorikk(ident: string, range: string): Promise<SykmeldingRecord[]> {
    if (bundledEnv.runtimeEnv === 'local') {
        logger.warn('Mock get sykmeldingshistorikk from regulus-maximus')

        return R.pipe(mockHistory, R.sortBy([(record) => record.sykmelding.aktivitet[0].fom, 'asc']))
    }

    const oboToken = await getOboToken('regulus-maximus')
    const response = await fetch(`${REGULUS_MAXIMUS_ADMIN}/sykmelding-history/${range}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}` },
        body: JSON.stringify({ userIdent: ident }),
    })

    if (!response.ok) {
        raise(`Failed to fetch job status from syk-inn-api: ${response.status} ${response.statusText}`)
    }

    const records: SykmeldingRecord[] = await response.json()
    return R.pipe(records, R.sortBy([(record) => record.sykmelding.aktivitet[0].fom, 'asc']))
}
