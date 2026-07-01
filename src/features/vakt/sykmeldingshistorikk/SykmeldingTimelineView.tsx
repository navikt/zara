'use client'

import { CloudIcon, CodeIcon, EarthIcon, NewsletterIcon } from '@navikt/aksel-icons'
import { Heading, InfoCard, Timeline, TimelinePeriodProps } from '@navikt/ds-react'
import { isAfter, subYears } from 'date-fns'
import React, { ReactElement } from 'react'
import * as R from 'remeda'

import { ValidTimelineRanges } from '#features/vakt/sykmeldingshistorikk/RangePicker'
import { useSelected } from '#features/vakt/sykmeldingshistorikk/useSelected'
import { toReadableDate } from '#lib/date'
import { SykmeldingRecord, SykmeldingRecordValidationResult } from '#services/apps/regulus-maximus/types'

type Props = {
    history: SykmeldingRecord[]
    range: ValidTimelineRanges
}

export function SykmeldingTimelineView({ history, range }: Props): ReactElement {
    const { selected, setSelected } = useSelected()
    const { start, end } = getTimelineRange(history, range)

    return (
        <div className="border rounded-md border-ax-border-info-subtle py-4">
            <Heading size="small" className="ml-4">
                Brukerens sykmeldinger fra {toReadableDate(start)} til {toReadableDate(end)}
            </Heading>
            {history.length > 0 ? (
                <Timeline startDate={start} endDate={end}>
                    {history.map((sykmelding) => (
                        <Timeline.Row key={sykmelding.sykmelding.id} label="">
                            {sykmelding.sykmelding.aktivitet.map((aktivitet, i) => (
                                <Timeline.Period
                                    key={i}
                                    start={new Date(aktivitet.fom)}
                                    end={new Date(aktivitet.tom)}
                                    status={sykmeldingOutcomeToStatus(sykmelding.validation)}
                                    icon={<SykmeldingTypeIcon type={sykmelding.sykmelding.type} />}
                                    onClick={() => setSelected(sykmelding.sykmelding.id)}
                                    isActive={sykmelding.sykmelding.id === selected}
                                >
                                    {JSON.stringify(aktivitet)}
                                </Timeline.Period>
                            ))}
                        </Timeline.Row>
                    ))}
                </Timeline>
            ) : (
                <div className="p-4">
                    <InfoCard data-color="info" className="max-w-prose">
                        <InfoCard.Header>
                            <InfoCard.Title>Ingen sykmeldinger valgt periode</InfoCard.Title>
                        </InfoCard.Header>
                    </InfoCard>
                </div>
            )}
        </div>
    )
}

function sykmeldingOutcomeToStatus(validation: SykmeldingRecordValidationResult): TimelinePeriodProps['status'] {
    switch (validation.status) {
        case 'OK':
            return 'success'
        case 'PENDING':
            return 'warning'
        case 'INVALID':
            return 'danger'
    }
}

function SykmeldingTypeIcon({ type }: { type: 'UTENLANDSK' | 'DIGITAL' | 'XML' | 'PAPIR' }): ReactElement {
    switch (type) {
        case 'UTENLANDSK':
            return <EarthIcon />
        case 'DIGITAL':
            return <CloudIcon />
        case 'XML':
            return <CodeIcon />
        case 'PAPIR':
            return <NewsletterIcon />
    }
}

function getTimelineRange(history: SykmeldingRecord[], range: ValidTimelineRanges): { start: Date; end: Date } {
    const now = new Date()
    const latestDate = R.pipe(
        history,
        R.flatMap((it) => it.sykmelding.aktivitet),
        R.map((it) => it.tom),
        R.firstBy([R.identity(), 'desc']),
    )
    const end = latestDate && isAfter(latestDate, now) ? new Date(latestDate) : now

    switch (range) {
        case 'LAST_1_YEARS':
            return {
                start: subYears(now, 1),
                end: end,
            }
        case 'LAST_3_YEARS':
            return {
                start: subYears(now, 3),
                end: end,
            }
        case 'LAST_10_YEARS':
            return {
                start: subYears(now, 10),
                end: end,
            }
    }
}
