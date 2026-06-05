'use client'

import * as R from 'remeda'
import { Heading, Timeline } from '@navikt/ds-react'
import React, { ReactElement } from 'react'
import { VitalsIcon } from '@navikt/aksel-icons'
import { isAfter, subYears } from 'date-fns'

import { SykmeldingRecord } from '@services/apps/regulus-maximus/types'
import { ValidTimelineRanges } from '@features/vakt/sykmeldingshistorikk/RangePicker'
import { useSelected } from '@features/vakt/sykmeldingshistorikk/useSelected'
import { toReadableDate } from '@lib/date'

type Props = {
    history: SykmeldingRecord[]
    range: ValidTimelineRanges
}

export function SykmeldingTimelineView({ history, range }: Props): ReactElement {
    const { selected, setSelected } = useSelected()
    const { start, end } = getTimelineRange(history, range)

    return (
        <div className="overflow-hidden border rounded-md border-ax-border-info-subtle py-4">
            <Heading size="small" className="ml-4">
                Brukerens sykmeldinger fra {toReadableDate(start)} til {toReadableDate(end)}
            </Heading>
            <Timeline startDate={start} endDate={end}>
                {history.map((sykmelding) => (
                    <Timeline.Row key={sykmelding.sykmelding.id} label="">
                        {sykmelding.sykmelding.aktivitet.map((aktivitet, i) => (
                            <Timeline.Period
                                key={i}
                                start={new Date(aktivitet.fom)}
                                end={new Date(aktivitet.tom)}
                                status="info"
                                icon={<VitalsIcon />}
                                onClick={() => setSelected(sykmelding.sykmelding.id)}
                                isActive={sykmelding.sykmelding.id === selected}
                            >
                                {JSON.stringify(aktivitet)}
                            </Timeline.Period>
                        ))}
                    </Timeline.Row>
                ))}
            </Timeline>
        </div>
    )
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
