import { addDays, format, formatISO, subMonths, subYears } from 'date-fns'

import { SykmeldingRecord } from './types'

const today = new Date()

const dateOnly = (date: Date): string => format(date, 'yyyy-MM-dd')
const timestamp = (date: Date): string => formatISO(date)

const anchorOne = subMonths(today, 8)
const anchorTwo = subMonths(today, 3)
const anchorThree = subYears(today, 2)
const anchorFour = subYears(today, 7)

export const mockHistory: SykmeldingRecord[] = [
    {
        metadata: { orgnummer: '12312321', type: 'DIGITAL' },
        validation: { status: 'OK', timestamp: timestamp(anchorOne), rules: [] },
        sykmelding: {
            id: 'test-id-1',
            metadata: {
                mottattDato: timestamp(anchorOne),
                genDate: timestamp(anchorOne),
                avsenderSystem: { navn: 'TestySystemmy', versjon: '1.0.0' },
            },
            pasient: {
                navn: { fornavn: 'Forri', mellomnavn: null, etternavn: 'Navni' },
                navKontor: null,
                navnFastlege: null,
                fnr: '11111111111',
                kontaktinfo: [],
            },
            medisinskVurdering: {
                hovedDiagnose: null,
                biDiagnoser: null,
                svangerskap: false,
                yrkesskade: null,
                skjermetForPasient: false,
                annenFravarsgrunn: null,
            },
            aktivitet: [
                {
                    grad: 90,
                    fom: dateOnly(anchorOne),
                    tom: dateOnly(addDays(anchorOne, 14)),
                    reisetilskudd: false,
                    type: 'GRADERT',
                },
            ],
            behandler: {
                navn: { fornavn: 'Beh', mellomnavn: null, etternavn: 'Handler' },
                adresse: null,
                ids: [],
                kontaktinfo: [],
            },
            sykmelder: { ids: [], helsepersonellKategori: 'HJELPEPLEIER' },
            arbeidsgiver: { type: 'INGEN_ARBEIDSGIVER' },
            tilbakedatering: null,
            bistandNav: null,
            utdypendeSporsmal: null,
            type: 'DIGITAL',
        },
    },
    {
        metadata: { orgnummer: '98798787', type: 'DIGITAL' },
        validation: { status: 'OK', timestamp: timestamp(anchorTwo), rules: [] },
        sykmelding: {
            id: 'test-id-2',
            metadata: {
                mottattDato: timestamp(anchorTwo),
                genDate: timestamp(anchorTwo),
                avsenderSystem: { navn: 'TestySystemmy', versjon: '1.0.0' },
            },
            pasient: {
                navn: { fornavn: 'Andre', mellomnavn: null, etternavn: 'Pasienti' },
                navKontor: null,
                navnFastlege: null,
                fnr: '22222222222',
                kontaktinfo: [],
            },
            medisinskVurdering: {
                hovedDiagnose: null,
                biDiagnoser: null,
                svangerskap: false,
                yrkesskade: null,
                skjermetForPasient: false,
                annenFravarsgrunn: null,
            },
            aktivitet: [
                {
                    innspillTilArbeidsgiver: 'Tilrettelegging av arbeidsoppgaver',
                    fom: dateOnly(anchorTwo),
                    tom: dateOnly(addDays(anchorTwo, 13)),
                    type: 'AVVENTENDE',
                },
                {
                    grad: 50,
                    fom: dateOnly(addDays(anchorTwo, 14)),
                    tom: dateOnly(addDays(anchorTwo, 28)),
                    reisetilskudd: false,
                    type: 'GRADERT',
                },
            ],
            behandler: {
                navn: { fornavn: 'Beh', mellomnavn: null, etternavn: 'Handler' },
                adresse: null,
                ids: [],
                kontaktinfo: [],
            },
            sykmelder: { ids: [], helsepersonellKategori: 'HJELPEPLEIER' },
            arbeidsgiver: { type: 'INGEN_ARBEIDSGIVER' },
            tilbakedatering: null,
            bistandNav: null,
            utdypendeSporsmal: null,
            type: 'DIGITAL',
        },
    },
    {
        metadata: { orgnummer: '11223344', type: 'DIGITAL' },
        validation: { status: 'OK', timestamp: timestamp(anchorThree), rules: [] },
        sykmelding: {
            id: 'test-id-3',
            metadata: {
                mottattDato: timestamp(anchorThree),
                genDate: timestamp(anchorThree),
                avsenderSystem: { navn: 'TestySystemmy', versjon: '1.0.0' },
            },
            pasient: {
                navn: { fornavn: 'Tredje', mellomnavn: null, etternavn: 'Personi' },
                navKontor: null,
                navnFastlege: null,
                fnr: '33333333333',
                kontaktinfo: [],
            },
            medisinskVurdering: {
                hovedDiagnose: null,
                biDiagnoser: null,
                svangerskap: false,
                yrkesskade: null,
                skjermetForPasient: false,
                annenFravarsgrunn: null,
            },
            aktivitet: [
                {
                    fom: dateOnly(anchorThree),
                    tom: dateOnly(addDays(anchorThree, 13)),
                    medisinskArsak: null,
                    arbeidsrelatertArsak: null,
                    type: 'AKTIVITET_IKKE_MULIG',
                },
                {
                    fom: dateOnly(addDays(anchorThree, 14)),
                    tom: dateOnly(addDays(anchorThree, 27)),
                    grad: 60,
                    reisetilskudd: false,
                    type: 'GRADERT',
                },
                {
                    fom: dateOnly(addDays(anchorThree, 28)),
                    tom: dateOnly(addDays(anchorThree, 41)),
                    antallBehandlingsdager: 3,
                    type: 'BEHANDLINGSDAGER',
                },
                {
                    fom: dateOnly(addDays(anchorThree, 42)),
                    tom: dateOnly(addDays(anchorThree, 55)),
                    type: 'REISETILSKUDD',
                },
                {
                    fom: dateOnly(addDays(anchorThree, 56)),
                    tom: dateOnly(addDays(anchorThree, 69)),
                    innspillTilArbeidsgiver: 'Vurder gradvis tilbakeføring',
                    type: 'AVVENTENDE',
                },
            ],
            behandler: {
                navn: { fornavn: 'Beh', mellomnavn: null, etternavn: 'Handler' },
                adresse: null,
                ids: [],
                kontaktinfo: [],
            },
            sykmelder: { ids: [], helsepersonellKategori: 'HJELPEPLEIER' },
            arbeidsgiver: { type: 'INGEN_ARBEIDSGIVER' },
            tilbakedatering: null,
            bistandNav: null,
            utdypendeSporsmal: null,
            type: 'DIGITAL',
        },
    },
    {
        metadata: { orgnummer: '55667788', type: 'DIGITAL' },
        validation: { status: 'OK', timestamp: timestamp(anchorFour), rules: [] },
        sykmelding: {
            id: 'test-id-4',
            metadata: {
                mottattDato: timestamp(anchorFour),
                genDate: timestamp(anchorFour),
                avsenderSystem: { navn: 'TestySystemmy', versjon: '1.0.0' },
            },
            pasient: {
                navn: { fornavn: 'Fjerde', mellomnavn: null, etternavn: 'Brukeri' },
                navKontor: null,
                navnFastlege: null,
                fnr: '44444444444',
                kontaktinfo: [],
            },
            medisinskVurdering: {
                hovedDiagnose: null,
                biDiagnoser: null,
                svangerskap: false,
                yrkesskade: null,
                skjermetForPasient: false,
                annenFravarsgrunn: null,
            },
            aktivitet: [
                {
                    grad: 40,
                    fom: dateOnly(anchorFour),
                    tom: dateOnly(addDays(anchorFour, 46)),
                    reisetilskudd: false,
                    type: 'GRADERT',
                },
            ],
            behandler: {
                navn: { fornavn: 'Beh', mellomnavn: null, etternavn: 'Handler' },
                adresse: null,
                ids: [],
                kontaktinfo: [],
            },
            sykmelder: { ids: [], helsepersonellKategori: 'HJELPEPLEIER' },
            arbeidsgiver: { type: 'INGEN_ARBEIDSGIVER' },
            tilbakedatering: null,
            bistandNav: null,
            utdypendeSporsmal: null,
            type: 'DIGITAL',
        },
    },
]
