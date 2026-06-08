import * as R from 'remeda'
import { logger } from '@navikt/next-logger'
import { isBefore, subYears } from 'date-fns'

import { bundledEnv } from '@lib/env'
import { getOboToken } from '@services/apps/common/obo'
import { raise } from '@lib/ts'
import { mockHistory } from '@services/apps/regulus-maximus/mock-data'
import { SykmeldingRecord } from '@services/apps/regulus-maximus/types'
import { ValidTimelineRanges } from '@features/vakt/sykmeldingshistorikk/RangePicker'

const REGULUS_MAXIMUS_ADMIN = 'http://regulus-maximus/internal/admin'

export async function getRegulusMaximusSykmeldingshistorikk(
    ident: string,
    range: ValidTimelineRanges,
): Promise<SykmeldingRecord[]> {
    if (bundledEnv.runtimeEnv === 'local') {
        logger.warn('Mock get sykmeldingshistorikk from regulus-maximus')

        let latestDate
        switch (range) {
            case 'LAST_1_YEARS':
                latestDate = subYears(new Date(), 1)
                break
            case 'LAST_3_YEARS':
                latestDate = subYears(new Date(), 3)
                break
            case 'LAST_10_YEARS':
                latestDate = subYears(new Date(), 10)
                break
        }

        return R.pipe(
            mockHistory,
            R.sortBy([(record) => record.sykmelding.aktivitet[0].fom, 'asc']),
            R.filter((record) => isBefore(latestDate, record.sykmelding.aktivitet[0].fom)),
        )
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
