'use client'

import { BodyShort, ExpansionCard, Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { Adresse } from '#components/info/Adresse'
import { Aktivitet } from '#components/info/Aktivitet'
import { Arbeidsgiver } from '#components/info/Arbeidsgiver'
import { DescriptiveList, DescriptiveItem, DescriptiveJson } from '#components/info/DescriptiveItems'
import { diagnose, navn } from '#components/info/format'
import { toReadableDate } from '#lib/date'
import {
    IArbeid,
    Prognose,
    SykmeldingRecord,
    SykmeldingRecordValidationResult,
} from '#services/apps/regulus-maximus/types'

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
        <div className="border rounded-md border-ax-border-info-subtle p-4 flex flex-col gap-3">
            <Heading size="medium" level="3">
                Detaljer for sykmelding {record.sykmelding.id}
            </Heading>
            <MessageTypeSpecificMetadata metadata={record.metadata} />
            <Validering validation={record.validation} />

            <div className="columns-3 gap-3">
                <DescriptiveList title="Pasient" className="break-inside-avoid mb-3">
                    <DescriptiveItem title="Navn">{navn(record.sykmelding.pasient.navn)}</DescriptiveItem>
                    <DescriptiveItem title="Ident (fnr/dnr)">{record.sykmelding.pasient.fnr}</DescriptiveItem>
                    <DescriptiveItem title="Navn fastlege">
                        {record.sykmelding.pasient.navnFastlege ?? 'Ingen'}
                    </DescriptiveItem>
                </DescriptiveList>

                <DescriptiveList title="Behandler" className="break-inside-avoid mb-3">
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

                {'sykmelder' in record.sykmelding && (
                    <DescriptiveList title="Sykmelder" className="break-inside-avoid mb-3">
                        {record.sykmelding.sykmelder.ids.map((id) => (
                            <DescriptiveItem key={id.id} title={id.type}>
                                {id.id}
                            </DescriptiveItem>
                        ))}
                        <DescriptiveItem title="Helsepersonellkategori">
                            {record.sykmelding.sykmelder.helsepersonellKategori}
                        </DescriptiveItem>
                    </DescriptiveList>
                )}

                <DescriptiveList title="Medisinsk vurdering" className="break-inside-avoid mb-3">
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

                <DescriptiveList title="Aktivitet (perioder)" className="break-inside-avoid mb-3">
                    {record.sykmelding.aktivitet.map((it) => (
                        <DescriptiveItem key={it.type + it.tom + it.tom} title="Periode 1">
                            <Aktivitet aktivitet={it} />
                        </DescriptiveItem>
                    ))}
                </DescriptiveList>

                <DescriptiveList title="Arbeidsgiver" className="break-inside-avoid mb-3">
                    {'arbeidsgiver' in record.sykmelding && record.sykmelding.arbeidsgiver ? (
                        <Arbeidsgiver arbeidsgiver={record.sykmelding.arbeidsgiver} />
                    ) : (
                        <DescriptiveItem title="Ingen arbeidsgiver">
                            Denne typen sykmelding har ikke arbeidsgivere
                        </DescriptiveItem>
                    )}
                </DescriptiveList>

                {'prognose' in record.sykmelding && (
                    <DescriptiveList title="Prognose" className="break-inside-avoid mb-3">
                        {record.sykmelding.prognose == null ? (
                            <DescriptiveItem title="Ingen prognose">Ikke oppgitt</DescriptiveItem>
                        ) : (
                            <PrognoseDetails prognose={record.sykmelding.prognose} />
                        )}
                    </DescriptiveList>
                )}

                {'tiltak' in record.sykmelding && (
                    <DescriptiveList title="Tiltak" className="break-inside-avoid mb-3">
                        {record.sykmelding.tiltak == null ? (
                            <DescriptiveItem title="Ingen tiltak">Ikke oppgitt</DescriptiveItem>
                        ) : (
                            <>
                                <DescriptiveItem title="Tiltak NAV">
                                    {record.sykmelding.tiltak.tiltakNav ?? 'Ingen'}
                                </DescriptiveItem>
                                <DescriptiveItem title="Andre tiltak">
                                    {record.sykmelding.tiltak.andreTiltak ?? 'Ingen'}
                                </DescriptiveItem>
                            </>
                        )}
                    </DescriptiveList>
                )}

                {'bistandNav' in record.sykmelding && (
                    <DescriptiveList title="Bistand NAV" className="break-inside-avoid mb-3">
                        {record.sykmelding.bistandNav == null ? (
                            <DescriptiveItem title="Ingen bistand">Ikke oppgitt</DescriptiveItem>
                        ) : (
                            <>
                                <DescriptiveItem title="Bistand umiddelbart">
                                    {record.sykmelding.bistandNav.bistandUmiddelbart ? 'Ja' : 'Nei'}
                                </DescriptiveItem>
                                {record.sykmelding.bistandNav.beskrivBistand != null && (
                                    <DescriptiveItem title="Beskrivelse">
                                        {record.sykmelding.bistandNav.beskrivBistand}
                                    </DescriptiveItem>
                                )}
                            </>
                        )}
                    </DescriptiveList>
                )}

                {'tilbakedatering' in record.sykmelding && (
                    <DescriptiveList title="Tilbakedatering" className="break-inside-avoid mb-3">
                        {record.sykmelding.tilbakedatering == null ? (
                            <DescriptiveItem title="Ingen tilbakedatering">Ikke oppgitt</DescriptiveItem>
                        ) : (
                            <>
                                <DescriptiveItem title="Kontaktdato">
                                    {record.sykmelding.tilbakedatering.kontaktDato != null
                                        ? toReadableDate(record.sykmelding.tilbakedatering.kontaktDato)
                                        : 'Ikke oppgitt'}
                                </DescriptiveItem>
                                <DescriptiveItem title="Begrunnelse">
                                    {record.sykmelding.tilbakedatering.begrunnelse ?? 'Ikke oppgitt'}
                                </DescriptiveItem>
                            </>
                        )}
                    </DescriptiveList>
                )}

                {'utdypendeSporsmal' in record.sykmelding && (
                    <DescriptiveList title="Utdypende spørsmål" className="break-inside-avoid mb-3">
                        {record.sykmelding.utdypendeSporsmal == null ||
                        record.sykmelding.utdypendeSporsmal.length === 0 ? (
                            <DescriptiveItem title="Ingen utdypende spørsmål">Ikke oppgitt</DescriptiveItem>
                        ) : (
                            record.sykmelding.utdypendeSporsmal.map((it, i) => (
                                <DescriptiveItem key={i} title={it.sporsmal ?? it.type}>
                                    {it.svar}
                                    {it.skjermetForArbeidsgiver && (
                                        <span className="block text-ax-text-neutral-subtle text-sm">
                                            Skjermet for arbeidsgiver
                                        </span>
                                    )}
                                </DescriptiveItem>
                            ))
                        )}
                    </DescriptiveList>
                )}

                {'utdypendeOpplysninger' in record.sykmelding && (
                    <DescriptiveList title="Utdypende opplysninger" className="break-inside-avoid mb-3">
                        {record.sykmelding.utdypendeOpplysninger == null ? (
                            <DescriptiveItem title="Ingen utdypende opplysninger">Ikke oppgitt</DescriptiveItem>
                        ) : (
                            <DescriptiveJson title="Utdypende opplysninger">
                                {record.sykmelding.utdypendeOpplysninger}
                            </DescriptiveJson>
                        )}
                    </DescriptiveList>
                )}

                {'utenlandskInfo' in record.sykmelding && (
                    <DescriptiveList title="Utenlandsk info" className="break-inside-avoid mb-3">
                        <DescriptiveItem title="Land">{record.sykmelding.utenlandskInfo.land}</DescriptiveItem>
                        <DescriptiveItem title="Folkeregistrert adresse er brakke/tilsvarende">
                            {record.sykmelding.utenlandskInfo.folkeRegistertAdresseErBrakkeEllerTilsvarende
                                ? 'Ja'
                                : 'Nei'}
                        </DescriptiveItem>
                        <DescriptiveItem title="Adresse er utland">
                            {record.sykmelding.utenlandskInfo.erAdresseUtland == null
                                ? 'Ikke oppgitt'
                                : record.sykmelding.utenlandskInfo.erAdresseUtland
                                  ? 'Ja'
                                  : 'Nei'}
                        </DescriptiveItem>
                    </DescriptiveList>
                )}
            </div>
        </div>
    )
}

function Validering({ validation }: { validation: SykmeldingRecordValidationResult }): ReactElement {
    return (
        <DescriptiveList title={`Validering: ${validation.status}`}>
            <DescriptiveItem title="Status">{validation.status}</DescriptiveItem>
            <DescriptiveItem title="Tidspunkt">{toReadableDate(validation.timestamp)}</DescriptiveItem>
            {validation.rules.length > 0 && (
                <DescriptiveItem title="Regler">
                    {validation.rules.map((rule, i) => (
                        <span key={i} className="block">
                            <span className="font-medium">{rule.type}</span>
                            {rule.type !== 'OK' && (
                                <span className="text-ax-text-neutral-subtle text-sm">
                                    {' '}
                                    — sykmeldt: {rule.reason.sykmeldt} / sykmelder: {rule.reason.sykmelder}
                                </span>
                            )}
                        </span>
                    ))}
                </DescriptiveItem>
            )}
        </DescriptiveList>
    )
}

function PrognoseDetails({ prognose }: { prognose: Prognose }): ReactElement {
    return (
        <>
            <DescriptiveItem title="Arbeidsfør etter periode">
                {prognose.arbeidsforEtterPeriode ? 'Ja' : 'Nei'}
            </DescriptiveItem>
            {prognose.hensynArbeidsplassen != null && (
                <DescriptiveItem title="Hensyn arbeidsplassen">{prognose.hensynArbeidsplassen}</DescriptiveItem>
            )}
            {prognose.arbeid != null && <IArbeidDetails arbeid={prognose.arbeid} />}
        </>
    )
}

function IArbeidDetails({ arbeid }: { arbeid: IArbeid }): ReactElement {
    switch (arbeid.type) {
        case 'ER_I_ARBEID':
            return (
                <>
                    <DescriptiveItem title="I arbeid: eget arbeid på sikt">
                        {arbeid.egetArbeidPaSikt ? 'Ja' : 'Nei'}
                    </DescriptiveItem>
                    <DescriptiveItem title="I arbeid: annet arbeid på sikt">
                        {arbeid.annetArbeidPaSikt ? 'Ja' : 'Nei'}
                    </DescriptiveItem>
                    {arbeid.arbeidFOM != null && (
                        <DescriptiveItem title="I arbeid fra">{toReadableDate(arbeid.arbeidFOM)}</DescriptiveItem>
                    )}
                    {arbeid.vurderingsdato != null && (
                        <DescriptiveItem title="Vurderingsdato">
                            {toReadableDate(arbeid.vurderingsdato)}
                        </DescriptiveItem>
                    )}
                </>
            )
        case 'ER_IKKE_I_ARBEID':
            return (
                <>
                    <DescriptiveItem title="Ikke i arbeid: arbeidsfør på sikt">
                        {arbeid.arbeidsforPaSikt ? 'Ja' : 'Nei'}
                    </DescriptiveItem>
                    {arbeid.arbeidsforFOM != null && (
                        <DescriptiveItem title="Arbeidsfør fra">{toReadableDate(arbeid.arbeidsforFOM)}</DescriptiveItem>
                    )}
                    {arbeid.vurderingsdato != null && (
                        <DescriptiveItem title="Vurderingsdato">
                            {toReadableDate(arbeid.vurderingsdato)}
                        </DescriptiveItem>
                    )}
                </>
            )
    }
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
                <ExpansionCard.Title id="json-details">Mangler det noe? Rå sykmelding JSON</ExpansionCard.Title>
            </ExpansionCard.Header>
            <ExpansionCard.Content>
                <pre className="px-4">{JSON.stringify(value, null, 2)}</pre>
            </ExpansionCard.Content>
        </ExpansionCard>
    )
}

export default SelectedSykmeldingDetails
