import { addDays, format, formatISO, subDays, subMonths, subWeeks, subYears } from 'date-fns'

import { SykmeldingRecord } from './types'

const today = new Date()

const dateOnly = (date: Date): string => format(date, 'yyyy-MM-dd')
const timestamp = (date: Date): string => formatISO(date)

const daysAgo = (n: number): Date => subDays(today, n)
const weeksAgo = (n: number): Date => subWeeks(today, n)
const monthsAgo = (n: number): Date => subMonths(today, n)
const yearsAgo = (n: number): Date => subYears(today, n)

export const mockHistory: SykmeldingRecord[] = [
    // DIGITAL — minimal, single GRADERT period, ingen arbeidsgiver, no diagnose
    {
        metadata: { orgnummer: '12312321', type: 'DIGITAL' },
        validation: { status: 'OK', timestamp: timestamp(monthsAgo(8)), rules: [] },
        sykmelding: {
            id: 'test-id-1',
            metadata: {
                mottattDato: timestamp(monthsAgo(8)),
                genDate: timestamp(monthsAgo(8)),
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
                    type: 'GRADERT',
                    grad: 90,
                    fom: dateOnly(monthsAgo(8)),
                    tom: dateOnly(addDays(monthsAgo(8), 14)),
                    reisetilskudd: false,
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
    // DIGITAL — two aktivitet periods: AVVENTENDE followed by GRADERT 50%
    {
        metadata: { orgnummer: '98798787', type: 'DIGITAL' },
        validation: { status: 'OK', timestamp: timestamp(monthsAgo(3)), rules: [] },
        sykmelding: {
            id: 'test-id-2',
            metadata: {
                mottattDato: timestamp(monthsAgo(3)),
                genDate: timestamp(monthsAgo(3)),
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
                    type: 'AVVENTENDE',
                    innspillTilArbeidsgiver: 'Tilrettelegging av arbeidsoppgaver',
                    fom: dateOnly(monthsAgo(3)),
                    tom: dateOnly(addDays(monthsAgo(3), 13)),
                },
                {
                    type: 'GRADERT',
                    grad: 50,
                    fom: dateOnly(addDays(monthsAgo(3), 14)),
                    tom: dateOnly(addDays(monthsAgo(3), 28)),
                    reisetilskudd: false,
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
    // DIGITAL — all five aktivitet types in sequence over ~10 weeks
    {
        metadata: { orgnummer: '11223344', type: 'DIGITAL' },
        validation: { status: 'OK', timestamp: timestamp(yearsAgo(2)), rules: [] },
        sykmelding: {
            id: 'test-id-3',
            metadata: {
                mottattDato: timestamp(yearsAgo(2)),
                genDate: timestamp(yearsAgo(2)),
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
                    type: 'AKTIVITET_IKKE_MULIG',
                    fom: dateOnly(yearsAgo(2)),
                    tom: dateOnly(addDays(yearsAgo(2), 13)),
                    medisinskArsak: null,
                    arbeidsrelatertArsak: null,
                },
                {
                    type: 'GRADERT',
                    grad: 60,
                    fom: dateOnly(addDays(yearsAgo(2), 14)),
                    tom: dateOnly(addDays(yearsAgo(2), 27)),
                    reisetilskudd: false,
                },
                {
                    type: 'BEHANDLINGSDAGER',
                    antallBehandlingsdager: 3,
                    fom: dateOnly(addDays(yearsAgo(2), 28)),
                    tom: dateOnly(addDays(yearsAgo(2), 41)),
                },
                {
                    type: 'REISETILSKUDD',
                    fom: dateOnly(addDays(yearsAgo(2), 42)),
                    tom: dateOnly(addDays(yearsAgo(2), 55)),
                },
                {
                    type: 'AVVENTENDE',
                    innspillTilArbeidsgiver: 'Vurder gradvis tilbakeføring',
                    fom: dateOnly(addDays(yearsAgo(2), 56)),
                    tom: dateOnly(addDays(yearsAgo(2), 69)),
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
    // DIGITAL — old entry, single long GRADERT period 7 years ago
    {
        metadata: { orgnummer: '55667788', type: 'DIGITAL' },
        validation: { status: 'OK', timestamp: timestamp(yearsAgo(7)), rules: [] },
        sykmelding: {
            id: 'test-id-4',
            metadata: {
                mottattDato: timestamp(yearsAgo(7)),
                genDate: timestamp(yearsAgo(7)),
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
                    type: 'GRADERT',
                    grad: 40,
                    fom: dateOnly(yearsAgo(7)),
                    tom: dateOnly(addDays(yearsAgo(7), 46)),
                    reisetilskudd: false,
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
    // DIGITAL — en arbeidsgiver, diagnose, yrkesskade, tilbakedatering, bistandNav, PENDING rule
    {
        metadata: { orgnummer: '66778899', type: 'DIGITAL' },
        validation: {
            status: 'PENDING',
            timestamp: timestamp(weeksAgo(6)),
            rules: [
                {
                    type: 'PENDING',
                    name: 'TILBAKEDATERING_KREVER_FLERE_OPPLYSNINGER',
                    validationType: 'MANUAL',
                    timestamp: timestamp(weeksAgo(6)),
                    reason: {
                        sykmeldt: 'Tilbakedatert sykmelding krever begrunnelse',
                        sykmelder: 'Mangler kontaktdato',
                    },
                },
            ],
        },
        sykmelding: {
            id: 'test-id-5',
            metadata: {
                mottattDato: timestamp(weeksAgo(6)),
                genDate: timestamp(weeksAgo(6)),
                avsenderSystem: { navn: 'TestySystemmy', versjon: '2.1.0' },
            },
            pasient: {
                navn: { fornavn: 'Femte', mellomnavn: 'Maria', etternavn: 'Pasient' },
                navKontor: 'NAV Oslo',
                navnFastlege: 'Dr. Fastlege',
                fnr: '55555555555',
                kontaktinfo: [],
            },
            medisinskVurdering: {
                hovedDiagnose: { system: 'ICPC2', kode: 'L87', tekst: 'Isjias' },
                biDiagnoser: [{ system: 'ICD10', kode: 'M54.4', tekst: 'Lumbago med isjias' }],
                svangerskap: false,
                yrkesskade: { yrkesskadeDato: dateOnly(daysAgo(45)) },
                skjermetForPasient: false,
                annenFravarsgrunn: null,
            },
            aktivitet: [
                {
                    type: 'AKTIVITET_IKKE_MULIG',
                    fom: dateOnly(weeksAgo(6)),
                    tom: dateOnly(addDays(weeksAgo(6), 13)),
                    medisinskArsak: {
                        beskrivelse: 'Sterke smerter hindrer arbeid',
                        arsak: ['TILSTAND_HINDRER_AKTIVITET'],
                    },
                    arbeidsrelatertArsak: null,
                },
            ],
            behandler: {
                navn: { fornavn: 'Anne', mellomnavn: null, etternavn: 'Lege' },
                adresse: {
                    type: 'ARBEIDSADRESSE',
                    gateadresse: 'Legeveien 1',
                    postnummer: '0123',
                    poststed: 'Oslo',
                    postboks: null,
                    kommune: 'Oslo',
                    land: 'NO',
                },
                ids: [{ id: '1234567', type: 'HPR' }],
                kontaktinfo: [],
            },
            sykmelder: { ids: [{ id: '1234567', type: 'HPR' }], helsepersonellKategori: 'LEGE' },
            arbeidsgiver: {
                type: 'EN_ARBEIDSGIVER',
                navn: 'Arbeidsplassen AS',
                yrkesbetegnelse: 'Systemutvikler',
                stillingsprosent: 100,
                meldingTilArbeidsgiver: null,
                tiltakArbeidsplassen: null,
            },
            tilbakedatering: {
                kontaktDato: dateOnly(daysAgo(47)),
                begrunnelse: 'Pasienten var for syk til å kontakte lege tidligere',
            },
            bistandNav: { bistandUmiddelbart: false, beskrivBistand: null },
            utdypendeSporsmal: null,
            type: 'DIGITAL',
        },
    },
    // XML — EMOTTAK metadata, flere arbeidsgivere, skjermetForPasient, prognose, tiltak, INVALID rule
    {
        metadata: {
            type: 'EMOTTAK',
            msgInfo: {
                type: 'SYKMELDING',
                genDate: timestamp(monthsAgo(14)),
                msgId: 'msg-xml-1',
                migVersjon: null,
            },
            sender: {
                navn: 'Legekontoret AS',
                type: 'IKKE_OPPGITT',
                ids: [{ id: '987654321', type: 'ENH' }],
                adresse: null,
                kontaktinfo: null,
                underOrganisasjon: null,
                helsepersonell: null,
            },
            receiver: {
                navn: 'NAV',
                type: 'IKKE_OPPGITT',
                ids: [{ id: '889640782', type: 'ENH' }],
                adresse: null,
                kontaktinfo: null,
                underOrganisasjon: null,
                helsepersonell: null,
            },
            mottakenhetBlokk: {
                ediLogid: 'edi-log-1',
                avsender: 'legekontor',
                ebXMLSamtaleId: 'samtale-1',
                mottaksId: 'mottaks-1',
                meldingsType: 'SYKMELD',
                avsenderRef: 'ref-1',
                avsenderFnrFraDigSignatur: null,
                mottattDato: timestamp(monthsAgo(14)),
                orgnummer: '987654321',
                avsenderOrgNrFraDigSignatur: null,
                partnerReferanse: 'partner-1',
                herIdentifikator: 'her-1',
                ebRole: 'Behandler',
                ebService: 'SykmeldingService',
                ebAction: 'SendSykmelding',
            },
            ack: { ackType: 'JA' },
            pasient: null,
            vedlegg: null,
        },
        validation: {
            status: 'INVALID',
            timestamp: timestamp(monthsAgo(14)),
            rules: [
                {
                    type: 'INVALID',
                    name: 'UGYLDIG_REGELSETT',
                    validationType: 'AUTOMATIC',
                    timestamp: timestamp(monthsAgo(14)),
                    reason: {
                        sykmeldt: 'Sykmeldingen er ugyldig',
                        sykmelder: 'Regelsettversjon mangler',
                    },
                },
            ],
        },
        sykmelding: {
            type: 'XML',
            id: 'test-id-6',
            metadata: {
                mottattDato: timestamp(monthsAgo(14)),
                genDate: timestamp(monthsAgo(14)),
                avsenderSystem: { navn: 'LegeSys', versjon: '3.5.0' },
                behandletTidspunkt: timestamp(monthsAgo(14)),
                regelsettVersjon: null,
                strekkode: '1234567890123',
            },
            pasient: {
                navn: { fornavn: 'Sjette', mellomnavn: null, etternavn: 'Pasient' },
                navKontor: null,
                navnFastlege: null,
                fnr: '66666666666',
                kontaktinfo: [],
            },
            medisinskVurdering: {
                hovedDiagnose: { system: 'ICD10', kode: 'F32', tekst: 'Depressiv episode' },
                biDiagnoser: null,
                svangerskap: false,
                yrkesskade: null,
                skjermetForPasient: true,
                syketilfelletStartDato: dateOnly(subDays(monthsAgo(14), 7)),
                annenFraversArsak: null,
            },
            aktivitet: [
                {
                    type: 'AKTIVITET_IKKE_MULIG',
                    fom: dateOnly(monthsAgo(14)),
                    tom: dateOnly(addDays(monthsAgo(14), 27)),
                    medisinskArsak: {
                        beskrivelse: null,
                        arsak: ['AKTIVITET_FORVERRER_TILSTAND'],
                    },
                    arbeidsrelatertArsak: {
                        beskrivelse: 'Konflikter på arbeidsplassen',
                        arsak: ['ANNET'],
                    },
                },
            ],
            behandler: {
                navn: { fornavn: 'Bjørn', mellomnavn: null, etternavn: 'Doktor' },
                adresse: null,
                ids: [{ id: '7654321', type: 'HPR' }],
                kontaktinfo: [],
            },
            sykmelder: { ids: [{ id: '7654321', type: 'HPR' }], helsepersonellKategori: 'LEGE' },
            arbeidsgiver: {
                type: 'FLERE_ARBEIDSGIVERE',
                navn: 'Konsulentfirmaet AS',
                yrkesbetegnelse: 'Konsulent',
                stillingsprosent: 60,
                meldingTilArbeidsgiver: 'Tilretteleg arbeidstid',
                tiltakArbeidsplassen: 'Fleksibel arbeidstid og hjemmekontor',
            },
            prognose: {
                arbeidsforEtterPeriode: true,
                hensynArbeidsplassen: 'Trenger roligere oppgaver en periode',
                arbeid: {
                    type: 'ER_I_ARBEID',
                    egetArbeidPaSikt: true,
                    annetArbeidPaSikt: false,
                    arbeidFOM: dateOnly(addDays(monthsAgo(14), 56)),
                    vurderingsdato: dateOnly(addDays(monthsAgo(14), 28)),
                },
            },
            tiltak: {
                tiltakNav: null,
                andreTiltak: 'Psykologhjelp',
            },
            bistandNav: null,
            tilbakedatering: null,
            utdypendeOpplysninger: null,
        },
    },
    // PAPIR — PAPIRSYKMELDING metadata, hjertediagnose, prognose ER_IKKE_I_ARBEID, tilbakedatering, bistandNav
    {
        metadata: {
            type: 'PAPIRSYKMELDING',
            msgInfo: {
                type: 'SYKMELDING',
                genDate: timestamp(yearsAgo(4)),
                msgId: 'msg-papir-1',
                migVersjon: '1',
            },
            sender: {
                navn: 'Sykehuset HF',
                type: 'IKKE_OPPGITT',
                ids: [{ id: '111222333', type: 'ENH' }],
                adresse: null,
                kontaktinfo: null,
                underOrganisasjon: null,
                helsepersonell: null,
            },
            receiver: {
                navn: 'NAV',
                type: 'IKKE_OPPGITT',
                ids: [{ id: '889640782', type: 'ENH' }],
                adresse: null,
                kontaktinfo: null,
                underOrganisasjon: null,
                helsepersonell: null,
            },
            journalPostId: 'journal-papir-1',
        },
        validation: { status: 'OK', timestamp: timestamp(yearsAgo(4)), rules: [] },
        sykmelding: {
            type: 'PAPIR',
            id: 'test-id-7',
            metadata: {
                mottattDato: timestamp(yearsAgo(4)),
                genDate: timestamp(yearsAgo(4)),
                avsenderSystem: { navn: 'PapirSys', versjon: '1.0.0' },
                behandletTidspunkt: timestamp(yearsAgo(4)),
                regelsettVersjon: '2',
                strekkode: '9876543210987',
            },
            pasient: {
                navn: { fornavn: 'Syvende', mellomnavn: 'Kristoffer', etternavn: 'Pasient' },
                navKontor: 'NAV Trondheim',
                navnFastlege: null,
                fnr: '77777777777',
                kontaktinfo: [],
            },
            medisinskVurdering: {
                hovedDiagnose: { system: 'ICPC2', kode: 'K92', tekst: 'Hjertesvikt' },
                biDiagnoser: [{ system: 'ICPC2', kode: 'K74', tekst: 'Iskemisk hjertesykdom med angina' }],
                svangerskap: false,
                yrkesskade: null,
                skjermetForPasient: false,
                syketilfelletStartDato: dateOnly(subDays(yearsAgo(4), 14)),
                annenFraversArsak: null,
            },
            aktivitet: [
                {
                    type: 'AKTIVITET_IKKE_MULIG',
                    fom: dateOnly(yearsAgo(4)),
                    tom: dateOnly(addDays(yearsAgo(4), 83)),
                    medisinskArsak: {
                        beskrivelse: 'Alvorlig hjertesykdom',
                        arsak: ['TILSTAND_HINDRER_AKTIVITET', 'AKTIVITET_FORHINDRER_BEDRING'],
                    },
                    arbeidsrelatertArsak: null,
                },
            ],
            behandler: {
                navn: { fornavn: 'Ingrid', mellomnavn: null, etternavn: 'Hjertespesialist' },
                adresse: {
                    type: 'ARBEIDSADRESSE',
                    gateadresse: 'Sykehusveien 10',
                    postnummer: '7030',
                    poststed: 'Trondheim',
                    postboks: null,
                    kommune: 'Trondheim',
                    land: 'NO',
                },
                ids: [{ id: '2345678', type: 'HPR' }],
                kontaktinfo: [],
            },
            sykmelder: { ids: [{ id: '2345678', type: 'HPR' }], helsepersonellKategori: 'LEGE' },
            arbeidsgiver: {
                type: 'EN_ARBEIDSGIVER',
                navn: 'Industri Norge AS',
                yrkesbetegnelse: 'Maskinoperatør',
                stillingsprosent: 100,
                meldingTilArbeidsgiver: null,
                tiltakArbeidsplassen: null,
            },
            prognose: {
                arbeidsforEtterPeriode: false,
                hensynArbeidsplassen: null,
                arbeid: {
                    type: 'ER_IKKE_I_ARBEID',
                    arbeidsforPaSikt: false,
                    arbeidsforFOM: null,
                    vurderingsdato: dateOnly(addDays(yearsAgo(4), 84)),
                },
            },
            tiltak: null,
            bistandNav: { bistandUmiddelbart: true, beskrivBistand: 'Behov for arbeidsavklaringspenger' },
            tilbakedatering: {
                kontaktDato: dateOnly(subDays(yearsAgo(4), 2)),
                begrunnelse: 'Innlagt på sykehus',
            },
            utdypendeOpplysninger: null,
        },
    },
    // UTENLANDSK — svensk sykmelding, no behandler/sykmelder/arbeidsgiver fields
    {
        metadata: {
            type: 'UTENLANDSK_SYKMELDING',
            land: 'Sverige',
            journalPostId: 'journal-utl-1',
        },
        validation: { status: 'OK', timestamp: timestamp(monthsAgo(1)), rules: [] },
        sykmelding: {
            type: 'UTENLANDSK',
            id: 'test-id-8',
            metadata: {
                mottattDato: timestamp(monthsAgo(1)),
                genDate: timestamp(monthsAgo(1)),
                avsenderSystem: { navn: 'Utlandssys', versjon: '1.0.0' },
                behandletTidspunkt: timestamp(monthsAgo(1)),
                regelsettVersjon: null,
                strekkode: null,
            },
            pasient: {
                navn: { fornavn: 'Åttende', mellomnavn: null, etternavn: 'Pasient' },
                navKontor: null,
                navnFastlege: null,
                fnr: '88888888888',
                kontaktinfo: [],
            },
            medisinskVurdering: {
                hovedDiagnose: { system: 'ICD10', kode: 'J06', tekst: 'Akutt øvre luftveisinfeksjon' },
                biDiagnoser: null,
                svangerskap: false,
                yrkesskade: null,
                skjermetForPasient: false,
                syketilfelletStartDato: null,
                annenFraversArsak: null,
            },
            aktivitet: [
                {
                    type: 'GRADERT',
                    grad: 100,
                    fom: dateOnly(monthsAgo(1)),
                    tom: dateOnly(addDays(monthsAgo(1), 6)),
                    reisetilskudd: false,
                },
            ],
            utenlandskInfo: {
                land: 'Sverige',
                folkeRegistertAdresseErBrakkeEllerTilsvarende: false,
                erAdresseUtland: true,
            },
        },
    },
]
