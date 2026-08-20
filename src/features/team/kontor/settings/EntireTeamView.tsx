'use client'

import { BodyShort, Heading, Switch } from '@navikt/ds-react'
import React, { ReactElement, startTransition } from 'react'
import * as R from 'remeda'

import { toggleVakt } from '#features/team/kontor/kontor-actions'
import { OfficeUser } from '#services/team-office/common/types'

type Props = {
    team: OfficeUser[]
}

export function EntireTeamView({ team }: Props): ReactElement {
    const { office, remote, away } = R.pipe(
        team,
        R.sortBy([R.prop('name'), 'desc']),
        R.groupBy((member) => member.default_loc),
    )

    return (
        <div>
            <Heading level="4" size="xsmall" spacing>
                FA1
            </Heading>
            <ul className="pl-5 mb-4">
                {office?.map((member) => (
                    <MemberCard member={member} key={member.id} />
                ))}
            </ul>
            <Heading level="4" size="xsmall" spacing>
                Remote
            </Heading>
            <ul className="pl-5">
                {remote?.map((member) => (
                    <MemberCard member={member} key={member.id} />
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

function MemberCard({ member }: { member: OfficeUser }): ReactElement {
    return (
        <li className="flex items-center justify-between">
            <BodyShort>{member.name}</BodyShort>
            <div aria-hidden className="border-b border-dotted grow self-end mb-2 mx-2"></div>
            <Switch
                checked={member.vaktable}
                size="small"
                onClick={() => {
                    startTransition(async () => {
                        await toggleVakt(member.id)
                    })
                }}
            >
                Vakt
            </Switch>
        </li>
    )
}
