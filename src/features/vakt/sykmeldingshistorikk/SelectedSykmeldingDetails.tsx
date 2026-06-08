'use client'

import React, { ReactElement } from 'react'
import { ExpansionCard } from '@navikt/ds-react'

import { SykmeldingRecord } from '@services/apps/regulus-maximus/types'

import { useSelected } from './useSelected'

type Props = {
    history: SykmeldingRecord[]
}

function SelectedSykmeldingDetails({ history }: Props): ReactElement | null {
    const { selected } = useSelected()

    if (history.length === 0) return null

    if (selected == null) {
        return <div className="p-4">Velg en sykmelding i tidslinjen for å se mer detaljer</div>
    }

    const sykmelding = history.find((s) => s.sykmelding.id === selected)

    if (sykmelding == null) {
        return <div className="p-4">Fant ikke sykmeldingen med ID {selected}... Det er meget rart!</div>
    }

    return (
        <div className="mt-4">
            <ExpansionCard aria-label="Demo med bare tittel" size="small">
                <ExpansionCard.Header>
                    <ExpansionCard.Title>Rå sykmelding JSON</ExpansionCard.Title>
                </ExpansionCard.Header>
                <ExpansionCard.Content>
                    <pre className="px-4">{JSON.stringify(sykmelding, null, 2)}</pre>
                </ExpansionCard.Content>
            </ExpansionCard>
        </div>
    )
}

export default SelectedSykmeldingDetails
