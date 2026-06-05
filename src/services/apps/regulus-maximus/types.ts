type FomTom = {
    fom: string
    tom: string
}

type Aktivitet = FomTom &
    (
        | { type: 'GRADERT'; grad: number; reisetilskudd: boolean }
        | { type: 'AKTIVITET_IKKE_MULIG'; medisinskArsak: unknown; arbeidsrelatertArsak: unknown }
        | { type: 'BEHANDLINGSDAGER'; antallBehandlingsdager: number }
        | { type: 'REISETILSKUDD' }
        | { type: 'AVVENTENDE'; innspillTilArbeidsgiver: string }
    )

type Sykmelding = {
    id: string
    type: string
    metadata: SykmeldingMetadata
    aktivitet: Aktivitet[]
    pasient: {
        navn: {
            fornavn: string
            mellomnavn: string | null
            etternavn: string
        }
        navKontor: string | null
        navnFastlege: string | null
        fnr: string
        kontaktinfo: unknown[]
    }
    behandler: {
        navn: {
            fornavn: string
            mellomnavn: string | null
            etternavn: string
        }
        adresse: unknown
        ids: unknown[]
        kontaktinfo: unknown[]
    }
    sykmelder: {
        ids: unknown[]
        helsepersonellKategori: string
    }
    arbeidsgiver: {
        type: string
    }
    tilbakedatering: unknown
    bistandNav: unknown
    utdypendeSporsmal: unknown
    medisinskVurdering: {
        hovedDiagnose: unknown
        biDiagnoser: unknown
        svangerskap: boolean
        yrkesskade: unknown
        skjermetForPasient: boolean
        annenFravarsgrunn: unknown
    }
}

type SykmeldingMetadata = {
    mottattDato: string
    genDate: string
    avsenderSystem: {
        navn: string
        versjon: string
    }
}

export type SykmeldingRecord = {
    metadata: unknown
    sykmelding: Sykmelding
    validation: unknown
}
