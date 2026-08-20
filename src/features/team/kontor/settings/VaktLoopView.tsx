import { BodyShort, Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'
import * as R from 'remeda'

import { OfficeUser } from '#services/team-office/common/types'

type Props = {
    team: OfficeUser[]
}

export function VaktLoopView({ team }: Props): ReactElement {
    const vaktables = R.pipe(
        team,
        R.filter((it) => it.vaktable),
        R.sortBy((it) => it.user_id),
    )

    return (
        <div className="mt-4">
            <Heading level="4" size="xsmall" spacing>
                Vaktrotasjon <span className="italic">({vaktables.length} som kan vakte)</span>
            </Heading>
            {vaktables.length === 0 ? (
                <BodyShort>Ingen er satt som vaktable.</BodyShort>
            ) : (
                <ul className="list-disc pl-5">
                    {vaktables.map((user) => (
                        <li key={user.user_id}>{user.name}</li>
                    ))}
                </ul>
            )}
        </div>
    )
}
