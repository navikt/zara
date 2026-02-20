'use client'

import React, { ReactElement, useTransition } from 'react'
import * as R from 'remeda'
import { Button, Heading } from '@navikt/ds-react'

import { KontorUser } from '@services/team-office/types'
import { registerKontor } from '@features/team/kontor/kontor-actions'

type Props = {
    me: KontorUser
    team: KontorUser[]
}

export function EntireTeamView({ me, team }: Props): ReactElement {
    const [office, remote] = R.partition(team, (member) => member.default_loc === 'office')
    const [isPending, startTransition] = useTransition()

    return (
        <div className="bg-ax-bg-sunken border border-ax-border-neutral-subtle p-3 rounded-md absolute w-64 right-0 top-0">
            <Heading level="4" size="small" spacing>
                FA1
            </Heading>
            <ul className="list-disc pl-5 mb-4">
                {office.map((member) => (
                    <li key={member.id}>{member.name}</li>
                ))}
            </ul>
            <Heading level="4" size="small" spacing>
                Remote
            </Heading>
            <ul className="list-disc pl-5">
                {remote.map((member) => (
                    <li key={member.id}>{member.name}</li>
                ))}
            </ul>
            <div className="mt-4">
                <Button
                    size="xsmall"
                    variant="secondary"
                    className="w-full"
                    loading={isPending}
                    onClick={() => {
                        startTransition(async () => {
                            await registerKontor(me.default_loc === 'office' ? 'remote' : 'office')
                        })
                    }}
                >
                    Bytt meg til {me.default_loc === 'office' ? 'remote' : 'FA1'}-ansatt
                </Button>
            </div>
        </div>
    )
}
