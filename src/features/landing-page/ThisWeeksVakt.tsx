import { BodyShort, Detail } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { currentVakt, currentYearWeek } from '#features/team/kontor/settings/vakt-utils'
import { getTeam } from '#services/team-office/team-office-service'

export async function ThisWeeksVakt(): Promise<ReactElement> {
    const team = await getTeam()
    const vakt = await currentVakt(team)

    const { year, week } = currentYearWeek()

    return (
        <div className="ml-8 h-full">
            <Detail>
                Vakt for uke {week}, {year}:
            </Detail>
            <BodyShort className="-mt-1 animate-bounce">{vakt?.name ?? 'ukjent'}</BodyShort>
        </div>
    )
}
