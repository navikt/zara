'use client'

import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'

import { SykmeldingRecord } from '@services/apps/regulus-maximus/types'

import { useSelected } from './useSelected'

type Props = {
    history: SykmeldingRecord[]
}

function SelectedSykmeldingDetails({ history }: Props): ReactElement {
    const { selected } = useSelected()

    if (selected == null) {
        return <div className="p-4">Velg en sykmelding i tidslinjen for å se mer detaljer</div>
    }

    const sykmelding = history.find((s) => s.sykmelding.id === selected)

    if (sykmelding == null) {
        return <div className="p-4">Fant ikke sykmeldingen med ID {selected}... Det er meget rart!</div>
    }

    return (
        <div className="mt-4 border border-ax-border-info-subtle py-4 rounded-md">
            <Heading size="small" className="ml-4">
                Rå JSON for sykmelding {selected}
            </Heading>
            <pre className="px-4">{JSON.stringify(sykmelding, null, 2)}</pre>
        </div>
    )
}

export default SelectedSykmeldingDetails
