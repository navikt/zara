import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'

import { Location } from '@services/team-office/types'
import { getMyself, getTeam } from '@services/team-office/team-office-service'
import Unregistered from '@features/team/kontor/unregistered/Unregistered'
import { EntireTeamView } from '@features/team/kontor/settings/EntireTeamView'
import MyModeButtons from '@features/team/kontor/settings/MyModeButtons'

async function KontorSettings(): Promise<ReactElement> {
    const me = await getMyself()

    if ('unregistered' in me) {
        return <Unregistered />
    }

    const team = await getTeam()

    return (
        <div className="flex flex-col gap-3">
            <div className="border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md grow max-w-prose">
                <Heading level="3" size="medium" spacing>
                    Deg
                </Heading>
                <div>Du er satt som {defaultLocToNorsk(me.default_loc)}.</div>
                <MyModeButtons me={me} />
            </div>
            <div className="border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md grow max-w-prose">
                <Heading level="3" size="medium" spacing>
                    Teamet ditt
                </Heading>
                <EntireTeamView team={team} />
            </div>
            <div></div>
        </div>
    )
}

function defaultLocToNorsk(loc: Location): string {
    switch (loc) {
        case 'office':
            return 'FA1-ansatt'
        case 'remote':
            return 'remote-ansatt'
        case 'away':
            return 'langtidsborte'
    }
}

export default KontorSettings
