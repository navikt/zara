'use client'

import React, { ReactElement } from 'react'
import * as R from 'remeda'
import { Heading } from '@navikt/ds-react'

import { OfficeUser } from '@services/team-office/types'

type Props = {
    team: OfficeUser[]
}

export function EntireTeamView({ team }: Props): ReactElement {
    const { office, remote, away } = R.groupBy(team, (member) => member.default_loc)

    return (
        <div>
            <Heading level="4" size="xsmall" spacing>
                FA1
            </Heading>
            <ul className="list-disc pl-5 mb-4">
                {office?.map((member) => (
                    <li key={member.id}>{member.name}</li>
                ))}
            </ul>
            <Heading level="4" size="xsmall" spacing>
                Remote
            </Heading>
            <ul className="list-disc pl-5">
                {remote?.map((member) => (
                    <li key={member.id}>{member.name}</li>
                ))}
            </ul>
            {away != null && (
                <>
                    <Heading level="4" size="xsmall" spacing className="mt-4">
                        Langtidsborte
                    </Heading>
                    <ul className="list-disc pl-5">
                        {away.map((member) => (
                            <li key={member.id}>{member.name}</li>
                        ))}
                    </ul>
                </>
            )}
        </div>
    )
}
