import { HeadHeartIcon, HospitalIcon, LayersIcon, PersonIcon, PillRectangleIcon } from '@navikt/aksel-icons'

export type VaktFeature = {
    Icon: typeof PersonIcon
    title: string
    href: `/vakt/${string}`
    description: string
    auditlog: boolean
}

export const produksjonsFeatures = {
    functional: {
        personLookup: {
            Icon: PersonIcon,
            title: 'Slå opp person i pdl-api',
            href: '/vakt/person-lookup',
            description: 'Søk på ident og se informasjon om person og identer.',
            auditlog: false,
        } satisfies VaktFeature,
        sykmeldingshistorikk: {
            Icon: HospitalIcon,
            title: 'Sykmeldingshistorikk',
            href: '/vakt/sykmeldingshistorikk',
            description: 'Se brukers sykmeldingshistorikk og detaljer for hver sykmelding.',
            auditlog: true,
        } satisfies VaktFeature,
        behandlerLookup: {
            Icon: HeadHeartIcon,
            title: 'Slå opp på HPR-nummer',
            href: '/vakt/hpr-lookup',
            description: 'Søk på HPR-nummer og se informasjon og helsepersonell i HPR-registeret og PDL.',
            auditlog: false,
        } satisfies VaktFeature,
    },
    technical: {
        kafkaConsumerGroups: {
            Icon: LayersIcon,
            title: 'Kafka consumer groups',
            href: '/vakt/kafka',
            description: 'Se teamets consumer groups, aktivitet og lag. Reset offsets og slett consumer groups.',
            auditlog: false,
        } satisfies VaktFeature,
        poisonPill: {
            Icon: PillRectangleIcon,
            title: 'Poison Pill Sykmelding',
            href: '/vakt/poison-pill',
            description:
                "Marker en sykmelding som 'poison pill', som betyr at den ikke skal prosesseres i syk-inn-api.",
            auditlog: false,
        } satisfies VaktFeature,
    },
} as const

export const functionalProduksjonsFeatureList = Object.values(produksjonsFeatures.functional)
export const technicalProduksjonsFeatureList = Object.values(produksjonsFeatures.technical)
