import React, { ReactElement } from 'react'

import { ValidTimelineRanges } from '#features/vakt/sykmeldingshistorikk/RangePicker'
import { logAuditEvent } from '#lib/audit-log'
import { raise } from '#lib/ts'
import { getRegulusMaximusSykmeldingshistorikk } from '#services/apps/regulus-maximus/regulus-maximus-service'
import { validateUserSession } from '#services/auth/auth'

import SelectedSykmeldingDetails from './SelectedSykmeldingDetails'
import { SykmeldingTimelineView } from './SykmeldingTimelineView'

type Props = {
    ident: string
    range: ValidTimelineRanges
}

async function Sykmeldingshistorikk({ ident, range }: Props): Promise<ReactElement> {
    const user = await validateUserSession('TEAM_MEMBER')

    logAuditEvent(
        `Sykmeldingshistorikk for perioden "${range}"`,
        'audit:read',
        user.navIdent ?? raise(`Unable to audit log for user without navIdent (${user.userId})`),
        ident,
    )

    const history = await getRegulusMaximusSykmeldingshistorikk(ident, range)

    return (
        <div>
            <SykmeldingTimelineView history={history} range={range} />
            <SelectedSykmeldingDetails history={history} />
        </div>
    )
}

export default Sykmeldingshistorikk
