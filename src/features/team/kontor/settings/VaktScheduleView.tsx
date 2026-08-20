import { BodyShort, Detail, Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { OfficeUser } from '#services/team-office/common/types'

import { currentVaktCursor, currentVaktSkew, currentYearWeek, vaktablesOrdered } from './vakt-utils'
import { WeekSkewButton } from './WeekSkewButton'

type Props = {
    team: OfficeUser[]
}

export async function VaktScheduleView({ team }: Props): Promise<ReactElement> {
    const { year, week } = currentYearWeek()
    const weekSkew = await currentVaktSkew()
    const vaktables = vaktablesOrdered(team)
    const cursor = currentVaktCursor(week, vaktables.length, weekSkew)

    return (
        <div className="mt-4">
            <div className="flex justify-between">
                <div>
                    <Heading level="4" size="xsmall">
                        Vaktrotasjon <span className="italic">({vaktables.length} som kan vakte)</span>
                    </Heading>
                    <Detail spacing>
                        Uke {week}, {year}
                    </Detail>
                </div>
                <div>
                    <WeekSkewButton year={year} week={week} skew={weekSkew} />
                </div>
            </div>
            {vaktables.length === 0 ? (
                <BodyShort>Ingen er satt som vaktable.</BodyShort>
            ) : (
                <ul className="list-disc pl-5">
                    {vaktables.map((user, index) => (
                        <li key={user.user_id}>
                            {index === cursor && <span className="font-bold">➡ </span>}
                            {user.name}
                            {index === cursor && <span> er vakt</span>}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
