import React, { ReactElement } from 'react'

import { validateUserSession } from '@services/auth/auth'
import { getRegulusMaximusSykmeldingshistorikk } from '@services/apps/regulus-maximus/regulus-maximus-service'
import { ValidTimelineRanges } from '@features/vakt/sykmeldingshistorikk/RangePicker'

import SelectedSykmeldingDetails from './SelectedSykmeldingDetails'
import { SykmeldingTimelineView } from './SykmeldingTimelineView'

type Props = {
    ident: string
    range: ValidTimelineRanges
}

async function Sykmeldingshistorikk({ ident, range }: Props): Promise<ReactElement> {
    await validateUserSession('TEAM_MEMBER')

    const history = await getRegulusMaximusSykmeldingshistorikk(ident, range)

    return (
        <div>
            <SykmeldingTimelineView history={history} range={range} />
            <SelectedSykmeldingDetails history={history} />
        </div>
    )
}

export default Sykmeldingshistorikk
