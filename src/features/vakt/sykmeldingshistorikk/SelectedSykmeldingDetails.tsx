'use client'

import React, { ReactElement } from 'react'
import { BodyShort, ExpansionCard, Heading } from '@navikt/ds-react'

import { SykmeldingRecord } from '@services/apps/regulus-maximus/types'
import { toReadableDate } from '@lib/date'
import { diagnose, navn } from '@components/info/format'
import { DescriptiveList, DescriptiveItem, DescriptiveJson } from '@components/info/DescriptiveItems'
import { Adresse } from '@components/info/Adresse'
import { Aktivitet } from '@components/info/Aktivitet'
import { Arbeidsgiver } from '@components/info/Arbeidsgiver'

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
            <SykmeldingRecordDetails record={sykmelding} />
            <JsonViewer value={sykmelding} />
        </div>
    )
}

function SykmeldingRecordDetails({ record }: { record: SykmeldingRecord }): ReactElement {
    return (
        <div className="grid grid-cols-3 gap-3 border rounded-md border-ax-border-info-subtle p-4">
            <Heading size="medium" level="3" className="col-span-3">
                Detaljer for sykmelding {record.sykmelding.id}
            </Heading>
            <MessageTypeSpecificMetadata metadata={record.metadata} />

            <DescriptiveList title="Pasient">
                <DescriptiveItem title="Navn">{navn(record.sykmelding.pasient.navn)}</DescriptiveItem>
                <DescriptiveItem title="Ident (fnr/dnr)">{record.sykmelding.pasient.fnr}</DescriptiveItem>
                <DescriptiveItem title="Navn fastlege">
                    {record.sykmelding.pasient.navnFastlege ?? 'Ingen'}
                </DescriptiveItem>
            </DescriptiveList>

            <DescriptiveList title="Behandler">
                {'behandler' in record.sykmelding ? (
                    <>
                        {record.sykmelding.behandler.ids.map((id) => (
                            <DescriptiveItem key={id.id} title={id.type}>
                                {id.id}
                            </DescriptiveItem>
                        ))}

                        <DescriptiveItem title="Navn">{navn(record.sykmelding.behandler.navn)}</DescriptiveItem>
                        <DescriptiveItem title="Adresse">
                            <Adresse adresse={record.sykmelding.behandler.adresse} />
                        </DescriptiveItem>
                    </>
                ) : (
                    <DescriptiveItem title="Ingen behandler">Sykmeldingen har ingen behandler</DescriptiveItem>
                )}
                <DescriptiveItem title="Ident (fnr/dnr)">{record.sykmelding.pasient.fnr}</DescriptiveItem>
                <DescriptiveItem title="Navn fastlege">
                    {record.sykmelding.pasient.navnFastlege ?? 'Ingen'}
                </DescriptiveItem>
            </DescriptiveList>

            <DescriptiveList title="Medisinsk vurdering">
                <DescriptiveItem title="Hoveddiagnose">
                    {diagnose(record.sykmelding.medisinskVurdering.hovedDiagnose)}
                </DescriptiveItem>
                {record.sykmelding.medisinskVurdering.biDiagnoser != null &&
                    record.sykmelding.medisinskVurdering.biDiagnoser.length > 0 && (
                        <DescriptiveItem title="Bidiagnoser">
                            {record.sykmelding.medisinskVurdering.biDiagnoser?.map((it) => (
                                <BodyShort key={JSON.stringify(it)}>{diagnose(it)}</BodyShort>
                            ))}
                        </DescriptiveItem>
                    )}
                {record.sykmelding.medisinskVurdering.yrkesskade?.yrkesskadeDato && (
                    <DescriptiveItem title="Yrkesskadedato">
                        {toReadableDate(record.sykmelding.medisinskVurdering.yrkesskade.yrkesskadeDato)}
                    </DescriptiveItem>
                )}
                <DescriptiveItem title="Svangersskapsrelatert?">
                    {record.sykmelding.medisinskVurdering.svangerskap ? 'Ja' : 'Nei'}
                </DescriptiveItem>
                <DescriptiveItem title="Skjermet for pasient?">
                    {record.sykmelding.medisinskVurdering.skjermetForPasient ? 'Ja' : 'Nei'}
                </DescriptiveItem>
            </DescriptiveList>

            <DescriptiveList title="Aktivitet (perioder)">
                {record.sykmelding.aktivitet.map((it) => (
                    <DescriptiveItem key={it.type + it.tom + it.tom} title="Periode 1">
                        <Aktivitet aktivitet={it} />
                    </DescriptiveItem>
                ))}
            </DescriptiveList>

            <DescriptiveList title="Arbeidsgiver">
                {'arbeidsgiver' in record.sykmelding && record.sykmelding.arbeidsgiver ? (
                    <Arbeidsgiver arbeidsgiver={record.sykmelding.arbeidsgiver} />
                ) : (
                    <DescriptiveItem title="Ingen arbeidsgiver">
                        Denne typen sykmelding har ikke arbeidsgivere
                    </DescriptiveItem>
                )}
            </DescriptiveList>

            {/** TODO **/}
        </div>
    )
}

function MessageTypeSpecificMetadata({ metadata }: { metadata: SykmeldingRecord['metadata'] }): ReactElement {
    switch (metadata.type) {
        case 'DIGITAL':
            return (
                <DescriptiveList title={`Meldingsmetadata for type: ${metadata.type}`} className="col-span-3">
                    <DescriptiveItem title="Orgnummer">{metadata.orgnummer}</DescriptiveItem>
                </DescriptiveList>
            )
        case 'EGENMELDT':
            return (
                <DescriptiveList title={`Meldingsmetadata for type: ${metadata.type}`} className="col-span-3">
                    <DescriptiveJson title="Message Info (msgInfo)">{metadata.msgInfo}</DescriptiveJson>
                </DescriptiveList>
            )
        case 'EMOTTAK':
            return (
                <ExpansionCard aria-labelledby="emottak-metadata" size="small" className="m-2 col-span-3">
                    <ExpansionCard.Header>
                        <ExpansionCard.Title id="emottak-metadata">Detaljert eMottak-metadata</ExpansionCard.Title>
                    </ExpansionCard.Header>
                    <ExpansionCard.Content>
                        <dl>
                            <DescriptiveJson title="Sender">{metadata.sender}</DescriptiveJson>
                            <DescriptiveJson title="Receiver">{metadata.receiver}</DescriptiveJson>
                            <DescriptiveJson title="Ack">{metadata.ack}</DescriptiveJson>
                            <DescriptiveJson title="Pasient">{metadata.pasient}</DescriptiveJson>
                            <DescriptiveJson title="Mottakenhet Blokk">{metadata.mottakenhetBlokk}</DescriptiveJson>
                            <DescriptiveJson title="Vedlegg">{metadata.vedlegg}</DescriptiveJson>
                            <DescriptiveJson title="Message Info (msgInfo)">{metadata.msgInfo}</DescriptiveJson>
                        </dl>
                    </ExpansionCard.Content>
                </ExpansionCard>
            )
        case 'ENKEL':
            return (
                <ExpansionCard aria-labelledby="enkel-metadata" size="small" className="m-2">
                    <ExpansionCard.Header>
                        <ExpansionCard.Title id="enkel-metadata">{`Detaljert 'Enkel'-metadata`}</ExpansionCard.Title>
                    </ExpansionCard.Header>
                    <ExpansionCard.Content>
                        <dl>
                            <DescriptiveJson title="Sender">{metadata.sender}</DescriptiveJson>
                            <DescriptiveJson title="Receiver">{metadata.receiver}</DescriptiveJson>
                            <DescriptiveJson title="Vedlegg">{metadata.vedlegg}</DescriptiveJson>
                            <DescriptiveJson title="Message Info (msgInfo)">{metadata.msgInfo}</DescriptiveJson>
                        </dl>
                    </ExpansionCard.Content>
                </ExpansionCard>
            )
        case 'PAPIRSYKMELDING':
            return (
                <DescriptiveList title={`Meldingsmetadata for type: ${metadata.type}`} className="col-span-3">
                    <DescriptiveItem title="JournalpostID">{metadata.journalPostId}</DescriptiveItem>
                    <ExpansionCard aria-labelledby="papir-metadata" size="small" className="m-2">
                        <ExpansionCard.Header>
                            <ExpansionCard.Title id="papir-metadata">{`Detaljert 'Papirsykmelding'-metadata`}</ExpansionCard.Title>
                        </ExpansionCard.Header>
                        <ExpansionCard.Content>
                            <dl>
                                <DescriptiveJson title="Sender">{metadata.sender}</DescriptiveJson>
                                <DescriptiveJson title="Receiver">{metadata.receiver}</DescriptiveJson>

                                <DescriptiveJson title="Message Info (msgInfo)">{metadata.msgInfo}</DescriptiveJson>
                            </dl>
                        </ExpansionCard.Content>
                    </ExpansionCard>
                </DescriptiveList>
            )
        case 'UTENLANDSK_SYKMELDING':
            return (
                <DescriptiveList title={`Meldingsmetadata for type: ${metadata.type}`} className="col-span-3">
                    <DescriptiveItem title="JournalpostID">{metadata.journalPostId}</DescriptiveItem>
                    <DescriptiveItem title="Land">{metadata.land}</DescriptiveItem>
                </DescriptiveList>
            )
    }
}

function JsonViewer({ value }: { value: unknown }): ReactElement {
    return (
        <ExpansionCard aria-labelledby="json-details" size="small" className="mt-4">
            <ExpansionCard.Header>
                <ExpansionCard.Title id="json-details">Rå sykmelding JSON</ExpansionCard.Title>
            </ExpansionCard.Header>
            <ExpansionCard.Content>
                <pre className="px-4">{JSON.stringify(value, null, 2)}</pre>
            </ExpansionCard.Content>
        </ExpansionCard>
    )
}

export default SelectedSykmeldingDetails
