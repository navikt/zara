import React, { ReactElement } from 'react'

import { Aktivitet as AktivitetType } from '@services/apps/regulus-maximus/types'

const typeLabel: Record<AktivitetType['type'], string> = {
    AKTIVITET_IKKE_MULIG: '100% sykmeldt',
    GRADERT: 'Gradert',
    BEHANDLINGSDAGER: 'Behandlingsdager',
    REISETILSKUDD: 'Reisetilskudd',
    AVVENTENDE: 'Avventende',
}

function DateRange({ fom, tom }: { fom: string; tom: string }): ReactElement {
    return (
        <span>
            {fom} &ndash; {tom}
        </span>
    )
}

/**
 * Completely vibe coded component:
 */
export function Aktivitet({ aktivitet }: { aktivitet: AktivitetType }): ReactElement {
    return (
        <div className="flex flex-col gap-0.5">
            <span className="font-medium">{typeLabel[aktivitet.type]}</span>
            <DateRange fom={aktivitet.fom} tom={aktivitet.tom} />
            <AktivitetDetails aktivitet={aktivitet} />
        </div>
    )
}

function AktivitetDetails({ aktivitet }: { aktivitet: AktivitetType }): ReactElement | null {
    switch (aktivitet.type) {
        case 'GRADERT':
            return (
                <span className="text-ax-text-neutral-subtle text-sm">
                    {aktivitet.grad}%{aktivitet.reisetilskudd ? ' · reisetilskudd' : ''}
                </span>
            )
        case 'BEHANDLINGSDAGER':
            return (
                <span className="text-ax-text-neutral-subtle text-sm">
                    {aktivitet.antallBehandlingsdager} behandlingsdag
                    {aktivitet.antallBehandlingsdager !== 1 ? 'er' : ''} per uke
                </span>
            )
        case 'AVVENTENDE':
            return <span className="text-ax-text-neutral-subtle text-sm">{aktivitet.innspillTilArbeidsgiver}</span>
        case 'AKTIVITET_IKKE_MULIG': {
            const lines: string[] = []
            if (aktivitet.medisinskArsak != null) {
                const arsak = aktivitet.medisinskArsak
                lines.push(['Medisinsk årsak', arsak.beskrivelse ?? arsak.arsak.join(', ')].filter(Boolean).join(': '))
            }
            if (aktivitet.arbeidsrelatertArsak != null) {
                const arsak = aktivitet.arbeidsrelatertArsak
                lines.push(
                    ['Arbeidsrelatert årsak', arsak.beskrivelse ?? arsak.arsak.join(', ')].filter(Boolean).join(': '),
                )
            }
            if (lines.length === 0) return null
            return (
                <span className="text-ax-text-neutral-subtle text-sm">
                    {lines.map((line, i) => (
                        <span key={i} className="block">
                            {line}
                        </span>
                    ))}
                </span>
            )
        }
        case 'REISETILSKUDD':
            return null
    }
}
