import { BodyShort, Detail, Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { OfficeUser } from '#services/team-office/common/types'

import { currentVakt, currentYearWeek, vaktablesOrdered } from './vakt-utils'
import { WeekSkewButton } from './WeekSkewButton'

type Props = {
    team: OfficeUser[]
}

export async function VaktScheduleView({ team }: Props): Promise<ReactElement> {
    const { year, week } = currentYearWeek()
    const vaktables = vaktablesOrdered(team)
    const vakt = await currentVakt(team)

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
                    <WeekSkewButton year={year} week={week} skew={vakt?.skew ?? 0} />
                </div>
            </div>
            {vaktables.length === 0 ? (
                <BodyShort>Ingen er satt som vaktable.</BodyShort>
            ) : (
                <ul className="list-disc pl-5">
                    {vaktables.map((user) => {
                        const isVakt = user.user_id === vakt?.user_id
                        return (
                            <li key={user.user_id}>
                                {isVakt && <span className="font-bold">➡ </span>}
                                {user.name}
                                {isVakt && <span> er vakt</span>}
                            </li>
                        )
                    })}
                </ul>
            )}
        </div>
    )
}
