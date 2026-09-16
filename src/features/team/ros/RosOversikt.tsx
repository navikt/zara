import {
    CheckmarkCircleIcon,
    ClockDashedIcon,
    PushPinIcon,
    QuestionmarkCircleIcon,
    XMarkOctagonIcon,
} from '@navikt/aksel-icons'
import { BodyShort, Detail, Heading, Tag, type TagProps } from '@navikt/ds-react'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import React, { ReactElement } from 'react'

import { validateUserSession } from '#services/auth/auth'
import type { RiskNode, RosNode, TiltakStatus } from '#services/ros/tryggnok-mapper'
import { getTryggnokRosResult } from '#services/ros/tryggnok-service'

function formatDate(value: string | null): string | null {
    if (value == null) return null
    return format(new Date(value), 'd. MMMM yyyy', { locale: nb })
}

const TILTAK_STATUS_CONFIG: Record<TiltakStatus, { variant: TagProps['variant']; Icon: typeof CheckmarkCircleIcon }> = {
    'Mulig tiltak': { variant: 'neutral', Icon: QuestionmarkCircleIcon },
    'Skal gjennomføres': { variant: 'neutral', Icon: ClockDashedIcon },
    Implementert: { variant: 'success', Icon: CheckmarkCircleIcon },
    'Besluttet å ikke gjennomføre': { variant: 'error', Icon: XMarkOctagonIcon },
}

function TiltakStatusTag({ status }: { status: TiltakStatus }): ReactElement {
    const { variant, Icon } = TILTAK_STATUS_CONFIG[status]
    return (
        <Tag size="xsmall" variant={variant} icon={<Icon aria-hidden />} className="mt-1">
            {status}
        </Tag>
    )
}

export async function RosOversikt(): Promise<ReactElement> {
    await validateUserSession('TEAM_MEMBER')

    const result = await getTryggnokRosResult()

    if (result == null) {
        return <BodyShort>Ingen ROS-data er eksportert enda. Kjør en ROS-eksport for å hente data.</BodyShort>
    }

    return (
        <div className="flex flex-col gap-10 mt-8">
            {result.map((ros) => (
                <RosAssessment key={ros.assessmentId} ros={ros} />
            ))}
        </div>
    )
}

function RosAssessment({ ros }: { ros: RosNode }): ReactElement {
    return (
        <section className="border border-ax-border-neutral-subtle bg-ax-bg-raised rounded-lg overflow-hidden">
            <div className="border-b border-ax-border-neutral-subtle bg-ax-bg-sunken px-5 py-4">
                <Detail uppercase>ROS-analyse #{ros.assessmentId}</Detail>
                <Heading level="2" size="medium">
                    {String(ros.title)}
                </Heading>
                {(ros.opprettet || ros.sistEndret) && (
                    <Detail className="text-ax-text-neutral-subtle mt-1">
                        {ros.opprettet && <>Opprettet {formatDate(ros.opprettet)}</>}
                        {ros.opprettet && ros.sistEndret && ' · '}
                        {ros.sistEndret && <>Sist endret {formatDate(ros.sistEndret)}</>}
                    </Detail>
                )}
            </div>
            {ros.risks.length === 0 ? (
                <BodyShort className="italic px-5 py-4">Ingen risikoer</BodyShort>
            ) : (
                <div className="flex flex-col divide-y divide-ax-border-neutral-subtle">
                    {ros.risks.map((risk) => (
                        <Risk key={risk.id} risk={risk} />
                    ))}
                </div>
            )}
        </section>
    )
}

function Risk({ risk }: { risk: RiskNode }): ReactElement {
    // Colour follows likelihood (Sannsynlighet): low/moderate (1–2) is green, higher (3–4+) is yellow.
    const likelihood = risk.sannsynlighet?.level ?? null
    const likelihoodColor =
        likelihood == null
            ? 'bg-ax-border-neutral-subtle'
            : likelihood <= 2
              ? 'bg-ax-bg-success-strong'
              : 'bg-ax-bg-warning-strong'
    const viktigFunn = risk.tags.viktigFunn

    return (
        <div className={viktigFunn ? 'flex bg-ax-bg-info-softA' : 'flex'}>
            {/* Likelihood indicator strip, matching the coloured column in TryggNok. */}
            <div className={`w-1.5 shrink-0 ${likelihoodColor}`} aria-hidden />
            <div className="grid flex-1 grid-cols-1 md:grid-cols-[2fr_1fr]">
                <div className="p-5 md:border-r border-ax-border-neutral-subtle">
                    <div className="flex items-start justify-between gap-3">
                        <Heading level="3" size="small" spacing>
                            {String(risk.title)}
                        </Heading>
                        {viktigFunn && (
                            <Tag
                                size="small"
                                variant="info-moderate"
                                icon={<PushPinIcon aria-hidden />}
                                className="shrink-0"
                            >
                                Viktig funn
                            </Tag>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                        {risk.sannsynlighet && (
                            <Tag size="small" variant="info">
                                Sannsynlighet: {risk.sannsynlighet.level} – {risk.sannsynlighet.label}
                            </Tag>
                        )}
                        {risk.konsekvens && (
                            <Tag size="small" variant="warning">
                                Konsekvens: {risk.konsekvens.level} – {risk.konsekvens.label}
                            </Tag>
                        )}
                    </div>
                    {risk.kommentar && (
                        <BodyShort size="small" className="whitespace-pre-line text-ax-text-neutral-subtle">
                            {risk.kommentar}
                        </BodyShort>
                    )}
                    {(risk.opprettet || risk.sistEndret) && (
                        <Detail className="text-ax-text-neutral-subtle mt-3">
                            {risk.opprettet && <>Opprettet {formatDate(risk.opprettet)}</>}
                            {risk.opprettet && risk.sistEndret && ' · '}
                            {risk.sistEndret && <>Sist endret {formatDate(risk.sistEndret)}</>}
                        </Detail>
                    )}
                </div>
                <div className="p-5 bg-ax-bg-sunken">
                    <Detail uppercase spacing>
                        Foreslåtte tiltak
                    </Detail>
                    {risk.tiltak.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                            {risk.tiltak.map((tiltak, i) => (
                                <li
                                    key={i}
                                    className="rounded border border-ax-border-neutral-subtle bg-ax-bg-default p-2"
                                >
                                    <BodyShort size="small">{String(tiltak.title)}</BodyShort>
                                    {tiltak.status && <TiltakStatusTag status={tiltak.status} />}
                                    {tiltak.sistEndret && (
                                        <Detail className="text-ax-text-neutral-subtle mt-1">
                                            Sist endret {formatDate(tiltak.sistEndret)}
                                        </Detail>
                                    )}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <BodyShort size="small" className="italic text-ax-text-neutral-subtle">
                            Ingen tiltak
                        </BodyShort>
                    )}
                </div>
            </div>
        </div>
    )
}
