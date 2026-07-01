import React, { ReactElement } from 'react'

import { ArbeidsgiverInfo } from '#services/apps/regulus-maximus/types'

import { DescriptiveItem } from './DescriptiveItems'

type ArbeidsgiverMedFelter = Extract<ArbeidsgiverInfo, { type: 'EN_ARBEIDSGIVER' | 'FLERE_ARBEIDSGIVERE' }>

function ArbeidsgiverFields({ arbeidsgiver }: { arbeidsgiver: ArbeidsgiverMedFelter }): ReactElement {
    return (
        <>
            {arbeidsgiver.navn != null && <DescriptiveItem title="Navn">{arbeidsgiver.navn}</DescriptiveItem>}
            {arbeidsgiver.yrkesbetegnelse != null && (
                <DescriptiveItem title="Yrkesbetegnelse">{arbeidsgiver.yrkesbetegnelse}</DescriptiveItem>
            )}
            {arbeidsgiver.stillingsprosent != null && (
                <DescriptiveItem title="Stillingsprosent">{arbeidsgiver.stillingsprosent}%</DescriptiveItem>
            )}
            {arbeidsgiver.meldingTilArbeidsgiver != null && (
                <DescriptiveItem title="Melding til arbeidsgiver">
                    {arbeidsgiver.meldingTilArbeidsgiver}
                </DescriptiveItem>
            )}
            {arbeidsgiver.tiltakArbeidsplassen != null && (
                <DescriptiveItem title="Tiltak på arbeidsplassen">{arbeidsgiver.tiltakArbeidsplassen}</DescriptiveItem>
            )}
        </>
    )
}

export function Arbeidsgiver({ arbeidsgiver }: { arbeidsgiver: ArbeidsgiverInfo }): ReactElement {
    switch (arbeidsgiver.type) {
        case 'EN_ARBEIDSGIVER':
            return <ArbeidsgiverFields arbeidsgiver={arbeidsgiver} />
        case 'FLERE_ARBEIDSGIVERE':
            return (
                <>
                    <DescriptiveItem title="Type">Flere arbeidsgivere</DescriptiveItem>
                    <ArbeidsgiverFields arbeidsgiver={arbeidsgiver} />
                </>
            )
        case 'INGEN_ARBEIDSGIVER':
            return <DescriptiveItem title="Ingen arbeidsgiver" />
    }
}
