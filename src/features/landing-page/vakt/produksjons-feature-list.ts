import { PillRectangleIcon } from '@navikt/aksel-icons'

export const produksjonsFeatures = {
    poisonPill: {
        Icon: PillRectangleIcon,
        title: 'Poison Pill Sykmelding',
        href: '/vakt/poison-pill',
        description: "Marker en sykmelding som 'poison pill', som betyr at den ikke skal prosesseres.",
        auditlog: false,
    },
} as const

export const produksjonsFeatureList = Object.values(produksjonsFeatures)
