import { HeadHeartIcon, HospitalIcon, PersonIcon, PillRectangleIcon } from '@navikt/aksel-icons'

export const produksjonsFeatures = {
    personLookup: {
        Icon: PersonIcon,
        title: 'Slå opp person i pdl-api',
        href: '/vakt/person-lookup',
        description: 'Søk på ident og se informasjon om person og identer.',
        auditlog: false,
    },
    sykmeldingshistorikk: {
        Icon: HospitalIcon,
        title: 'Sykmeldingshistorikk',
        href: '/vakt/sykmeldingshistorikk',
        description: 'Se brukers sykmeldingshistorikk og detaljer for hver sykmelding.',
        auditlog: true,
    },
    behandlerLookup: {
        Icon: HeadHeartIcon,
        title: 'Slå opp på HPR-nummer',
        href: '/vakt/hpr-lookup',
        description: 'Søk på HPR-nummer og se informasjon og helsepersonell i HPR-registeret og PDL.',
        auditlog: false,
    },
    poisonPill: {
        Icon: PillRectangleIcon,
        title: 'Poison Pill Sykmelding',
        href: '/vakt/poison-pill',
        description: "Marker en sykmelding som 'poison pill', som betyr at den ikke skal prosesseres.",
        auditlog: false,
    },
} as const

export const produksjonsFeatureList = Object.values(produksjonsFeatures)
