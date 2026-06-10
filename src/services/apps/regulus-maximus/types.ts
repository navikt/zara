/**
 * These types are generated using Copilot based on the Kotlin types in tsm-sykmelding-input library.
 */

// ---- Shared primitives ----

export type Navn = {
    fornavn: string
    mellomnavn: string | null
    etternavn: string
}

type PersonIdType =
    | 'FNR'
    | 'DNR'
    | 'HNR'
    | 'HPR'
    | 'HER'
    | 'PNR'
    | 'SEF'
    | 'DKF'
    | 'SSN'
    | 'FPN'
    | 'XXX'
    | 'DUF'
    | 'IKKE_OPPGITT'
    | 'UGYLDIG'

type PersonId = {
    id: string
    type: PersonIdType
}

type AdresseType =
    | 'BOSTEDSADRESSE'
    | 'FOLKEREGISTERADRESSE'
    | 'FERIEADRESSE'
    | 'FAKTURERINGSADRESSE'
    | 'POSTADRESSE'
    | 'BESOKSADRESSE'
    | 'MIDLERTIDIG_ADRESSE'
    | 'ARBEIDSADRESSE'
    | 'UBRUKELIG_ADRESSE'
    | 'UKJENT'
    | 'UGYLDIG'

export type Adresse = {
    type: AdresseType
    gateadresse: string | null
    postnummer: string | null
    poststed: string | null
    postboks: string | null
    kommune: string | null
    land: string | null
}

type KontaktinfoType =
    | 'TELEFONSVARER'
    | 'NODNUMMER'
    | 'FAX_TELEFAKS'
    | 'HJEMME_ELLER_UKJENT'
    | 'HOVEDTELEFON'
    | 'FERIETELEFON'
    | 'MOBILTELEFON'
    | 'PERSONSOKER'
    | 'ARBEIDSPLASS_SENTRALBORD'
    | 'ARBEIDSPLASS_DIREKTENUMMER'
    | 'ARBEIDSPLASS'
    | 'TLF'
    | 'IKKE_OPPGITT'
    | 'UGYLDIG'

type Kontaktinfo = {
    type: KontaktinfoType
    value: string
}

type HelsepersonellKategori =
    | 'HELSESEKRETAR'
    | 'KIROPRAKTOR'
    | 'LEGE'
    | 'MANUELLTERAPEUT'
    | 'TANNLEGE'
    | 'FYSIOTERAPEUT'
    | 'SYKEPLEIER'
    | 'HJELPEPLEIER'
    | 'HELSEFAGARBEIDER'
    | 'USPESIFISERT'
    | 'JORDMOR'
    | 'AUDIOGRAF'
    | 'NAPRAPAT'
    | 'AMBULANSEARBEIDER'
    | 'PSYKOLOG'
    | 'FOTTERAPEUT'
    | 'TANNHELSESEKRETAR'
    | 'UGYLDIG'
    | 'IKKE_OPPGITT'

// ---- Organisasjon ----

type OrgIdType = 'AKO' | 'APO' | 'AVD' | 'ENH' | 'HER' | 'LAV' | 'LIN' | 'LOK' | 'NPR' | 'RSH' | 'SYS' | 'UGYLDIG'

type OrganisasjonsType = 'PRIVATE_SPESIALISTER_MED_DRIFTSAVTALER' | 'TANNLEGE_TANNHELSE' | 'IKKE_OPPGITT' | 'UGYLDIG'

type OrgId = { id: string; type: OrgIdType }

type UnderOrganisasjon = {
    navn: string
    type: OrganisasjonsType
    adresse: Adresse | null
    kontaktinfo: Kontaktinfo[]
    ids: OrgId[]
}

type RolleTilPasient = 'JOURNALANSVARLIG' | 'FASTLEGE' | 'IKKE_OPPGITT'

type Kjonn = 'MANN' | 'KVINNE' | 'USPESIFISERT' | 'IKKE_OPPGITT' | 'UGYLDIG'

type Helsepersonell = {
    ids: PersonId[]
    navn: Navn | null
    fodselsdato: string | null
    kjonn: Kjonn | null
    nasjonalitet: string | null
    adresse: Adresse | null
    kontaktinfo: Kontaktinfo[]
    helsepersonellKategori: HelsepersonellKategori
    rolleTilPasient: RolleTilPasient
}

type Organisasjon = {
    navn: string | null
    type: OrganisasjonsType
    ids: OrgId[]
    adresse: Adresse | null
    kontaktinfo: Kontaktinfo[] | null
    underOrganisasjon: UnderOrganisasjon | null
    helsepersonell: Helsepersonell | null
}

// ---- MessageMetadata ----

/** Pasient in message metadata context (differs from the sykmelding-level Pasient) */
type MetadataPasient = {
    ids: PersonId[]
    navn: Navn | null
    fodselsdato: string | null
    kjonn: Kjonn | null
    nasjonalitet: string | null
    adresse: Adresse | null
    kontaktinfo: Kontaktinfo[]
}

type AckType = 'JA' | 'NEI' | 'KUN_VED_FEIL' | 'IKKE_OPPGITT' | 'UGYLDIG'
type Meldingstype = 'SYKMELDING'

type MessageInfo = {
    type: Meldingstype
    genDate: string
    msgId: string
    migVersjon: string | null
}

type MottakenhetBlokk = {
    ediLogid: string
    avsender: string
    ebXMLSamtaleId: string
    mottaksId: string | null
    meldingsType: string
    avsenderRef: string
    avsenderFnrFraDigSignatur: string | null
    mottattDato: string
    orgnummer: string | null
    avsenderOrgNrFraDigSignatur: string | null
    partnerReferanse: string
    herIdentifikator: string
    ebRole: string
    ebService: string
    ebAction: string
}

type Ack = { ackType: AckType }

type MessageMetadataDigital = {
    type: 'DIGITAL'
    orgnummer: string
}

type MessageMetadataPapir = {
    type: 'PAPIRSYKMELDING'
    msgInfo: MessageInfo
    sender: Organisasjon
    receiver: Organisasjon
    journalPostId: string
}

type MessageMetadataUtenlandsk = {
    type: 'UTENLANDSK_SYKMELDING'
    land: string
    journalPostId: string
}

type MessageMetadataXml =
    | {
          type: 'EGENMELDT'
          msgInfo: MessageInfo
      }
    | {
          type: 'EMOTTAK'
          mottakenhetBlokk: MottakenhetBlokk
          ack: Ack
          msgInfo: MessageInfo
          sender: Organisasjon
          receiver: Organisasjon
          pasient: MetadataPasient | null
          vedlegg: string[] | null
      }
    | {
          type: 'ENKEL'
          msgInfo: MessageInfo
          sender: Organisasjon
          receiver: Organisasjon
          vedlegg: string[] | null
      }

// ---- Pasient & Behandler (sykmelding level) ----

type Pasient = {
    navn: Navn | null
    navKontor: string | null
    navnFastlege: string | null
    fnr: string
    kontaktinfo: Kontaktinfo[]
}

type Behandler = {
    navn: Navn
    adresse: Adresse | null
    ids: PersonId[]
    kontaktinfo: Kontaktinfo[]
}

type Sykmelder = {
    ids: PersonId[]
    helsepersonellKategori: HelsepersonellKategori
}

// ---- Aktivitet ----

export type Aktivitet =
    | { type: 'BEHANDLINGSDAGER'; fom: string; tom: string; antallBehandlingsdager: number }
    | { type: 'GRADERT'; fom: string; tom: string; grad: number; reisetilskudd: boolean }
    | { type: 'REISETILSKUDD'; fom: string; tom: string }
    | { type: 'AVVENTENDE'; fom: string; tom: string; innspillTilArbeidsgiver: string }
    | {
          type: 'AKTIVITET_IKKE_MULIG'
          fom: string
          tom: string
          medisinskArsak: MedisinskArsak | null
          arbeidsrelatertArsak: ArbeidsrelatertArsak | null
      }

type MedisinskArsakType =
    | 'TILSTAND_HINDRER_AKTIVITET'
    | 'AKTIVITET_FORVERRER_TILSTAND'
    | 'AKTIVITET_FORHINDRER_BEDRING'
    | 'ANNET'

type ArbeidsrelatertArsakType = 'MANGLENDE_TILRETTELEGGING' | 'ANNET'

type MedisinskArsak = { beskrivelse: string | null; arsak: MedisinskArsakType[] }
type ArbeidsrelatertArsak = { beskrivelse: string | null; arsak: ArbeidsrelatertArsakType[] }

// ---- Arbeidsgiver ----

export type ArbeidsgiverInfo =
    | {
          type: 'EN_ARBEIDSGIVER'
          navn: string | null
          yrkesbetegnelse: string | null
          stillingsprosent: number | null
          meldingTilArbeidsgiver: string | null
          tiltakArbeidsplassen: string | null
      }
    | {
          type: 'FLERE_ARBEIDSGIVERE'
          navn: string | null
          yrkesbetegnelse: string | null
          stillingsprosent: number | null
          meldingTilArbeidsgiver: string | null
          tiltakArbeidsplassen: string | null
      }
    | { type: 'INGEN_ARBEIDSGIVER' }

// ---- IArbeid (for Prognose) ----

type IArbeid =
    | {
          type: 'ER_I_ARBEID'
          egetArbeidPaSikt: boolean
          annetArbeidPaSikt: boolean
          arbeidFOM: string | null
          vurderingsdato: string | null
      }
    | {
          type: 'ER_IKKE_I_ARBEID'
          arbeidsforPaSikt: boolean
          arbeidsforFOM: string | null
          vurderingsdato: string | null
      }

// ---- Diagnose & MedisinskVurdering ----

type DiagnoseSystem = 'ICPC2' | 'ICD10' | 'ICPC2B' | 'PHBU' | 'UGYLDIG'

export type DiagnoseInfo = { system: DiagnoseSystem; kode: string; tekst: string | null }

type AnnenFravarArsakType =
    | 'GODKJENT_HELSEINSTITUSJON'
    | 'BEHANDLING_FORHINDRER_ARBEID'
    | 'ARBEIDSRETTET_TILTAK'
    | 'MOTTAR_TILSKUDD_GRUNNET_HELSETILSTAND'
    | 'NODVENDIG_KONTROLLUNDENRSOKELSE'
    | 'SMITTEFARE'
    | 'ABORT'
    | 'UFOR_GRUNNET_BARNLOSHET'
    | 'DONOR'
    | 'BEHANDLING_STERILISERING'

type AnnenFraverArsak = { beskrivelse: string | null; arsak: AnnenFravarArsakType[] | null }

type MedisinskVurderingBase = {
    hovedDiagnose: DiagnoseInfo | null
    biDiagnoser: DiagnoseInfo[] | null
    svangerskap: boolean
    yrkesskade: { yrkesskadeDato: string | null } | null
    skjermetForPasient: boolean
}

/** Used by Xml, Papir, Utenlandsk */
type MedisinskVurderingLegacy = MedisinskVurderingBase & {
    syketilfelletStartDato: string | null
    annenFraversArsak: AnnenFraverArsak | null
}

/** Used by Digital */
type MedisinskVurderingDigital = MedisinskVurderingBase & {
    annenFravarsgrunn: AnnenFravarArsakType | null
}

// ---- Misc sykmelding fields ----

type AvsenderSystem = { navn: string; versjon: string }

type SykmeldingMetaBase = {
    mottattDato: string
    genDate: string
    avsenderSystem: AvsenderSystem
}

type SykmeldingMetaLegacy = SykmeldingMetaBase & {
    behandletTidspunkt: string
    regelsettVersjon: string | null
    strekkode: string | null
}

type SykmeldingMetaDigital = SykmeldingMetaBase

type BistandNav = { bistandUmiddelbart: boolean; beskrivBistand: string | null }

type Tiltak = { tiltakNav: string | null; andreTiltak: string | null }

type Prognose = {
    arbeidsforEtterPeriode: boolean
    hensynArbeidsplassen: string | null
    arbeid: IArbeid | null
}

type Tilbakedatering = { kontaktDato: string | null; begrunnelse: string | null }

type UtenlandskInfo = {
    land: string
    folkeRegistertAdresseErBrakkeEllerTilsvarende: boolean
    erAdresseUtland: boolean | null
}

type Sporsmalstype =
    | 'UTFORDRINGER_MED_GRADERT_ARBEID'
    | 'UTFORDRINGER_MED_ARBEID'
    | 'MEDISINSK_OPPSUMMERING'
    | 'HENSYN_PA_ARBEIDSPLASSEN'
    | 'BEHANDLING_OG_FREMTIDIG_ARBEID'
    | 'UAVKLARTE_FORHOLD'
    | 'FORVENTET_HELSETILSTAND_UTVIKLING'
    | 'MEDISINSKE_HENSYN'

type UtdypendeSporsmal = {
    svar: string
    type: Sporsmalstype
    skjermetForArbeidsgiver: boolean
    sporsmal: string | null
}

type SvarRestriksjon = 'SKJERMET_FOR_ARBEIDSGIVER' | 'SKJERMET_FOR_PASIENT' | 'SKJERMET_FOR_NAV'

type SporsmalSvar = {
    sporsmal: string | null
    svar: string
    restriksjoner: SvarRestriksjon[]
}

// ---- Validation ----

type RuleType = 'OK' | 'PENDING' | 'INVALID'
type ValidationType = 'AUTOMATIC' | 'MANUAL'

type Reason = { sykmeldt: string; sykmelder: string }

type Rule =
    | { type: 'INVALID'; name: string; validationType: ValidationType; timestamp: string; reason: Reason }
    | { type: 'PENDING'; name: string; validationType: ValidationType; timestamp: string; reason: Reason }
    | { type: 'OK'; name: string; validationType: ValidationType; timestamp: string }

export type SykmeldingRecordValidationResult = {
    status: RuleType
    timestamp: string
    rules: Rule[]
}

// ---- Sykmelding variants ----

/** Shared by Xml, Papir, Utenlandsk */
type SykmeldingNasjonalLegacyBase = {
    id: string
    metadata: SykmeldingMetaLegacy
    pasient: Pasient
    medisinskVurdering: MedisinskVurderingLegacy
    aktivitet: Aktivitet[]
    arbeidsgiver: ArbeidsgiverInfo
    behandler: Behandler
    sykmelder: Sykmelder
    prognose: Prognose | null
    tiltak: Tiltak | null
    bistandNav: BistandNav | null
    tilbakedatering: Tilbakedatering | null
    utdypendeOpplysninger: Record<string, Record<string, SporsmalSvar>> | null
}

// ---- SykmeldingRecord (the top-level discriminated union) ----

export type SykmeldingRecord =
    | {
          sykmelding: {
              type: 'DIGITAL'
              id: string
              metadata: SykmeldingMetaDigital
              pasient: Pasient
              medisinskVurdering: MedisinskVurderingDigital
              aktivitet: Aktivitet[]
              behandler: Behandler
              sykmelder: Sykmelder
              arbeidsgiver: ArbeidsgiverInfo
              tilbakedatering: Tilbakedatering | null
              bistandNav: BistandNav | null
              utdypendeSporsmal: UtdypendeSporsmal[] | null
          }
          metadata: MessageMetadataDigital
          validation: SykmeldingRecordValidationResult
      }
    | {
          sykmelding: SykmeldingNasjonalLegacyBase & { type: 'XML' }
          metadata: MessageMetadataXml
          validation: SykmeldingRecordValidationResult
      }
    | {
          sykmelding: SykmeldingNasjonalLegacyBase & { type: 'PAPIR' }
          metadata: MessageMetadataPapir
          validation: SykmeldingRecordValidationResult
      }
    | {
          sykmelding: {
              type: 'UTENLANDSK'
              id: string
              metadata: SykmeldingMetaLegacy
              pasient: Pasient
              medisinskVurdering: MedisinskVurderingLegacy
              aktivitet: Aktivitet[]
              utenlandskInfo: UtenlandskInfo
          }
          metadata: MessageMetadataUtenlandsk
          validation: SykmeldingRecordValidationResult
      }
