import { BodyShort, Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { EntireTeamView } from '#features/team/kontor/settings/EntireTeamView'
import MyModeButtons from '#features/team/kontor/settings/MyModeButtons'
import Unregistered from '#features/team/kontor/unregistered/Unregistered'
import { Location } from '#services/team-office/common/types'
import { getMyself } from '#services/team-office/me-office-service'
import { getTeam } from '#services/team-office/team-office-service'

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
                <BodyShort spacing>Du er satt som {defaultLocToNorsk(me.default_loc)}.</BodyShort>
                <div>
                    Du har nav ident: <span className="italic">{me.nav_ident ?? 'Ingen! Det var rart..'}</span>
                </div>
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
