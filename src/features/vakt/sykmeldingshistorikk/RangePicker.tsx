'use client'

import { Select } from '@navikt/ds-react'
import { parseAsStringLiteral, useQueryState } from 'nuqs'
import React, { ReactElement } from 'react'

const validOptions = ['LAST_1_YEARS', 'LAST_3_YEARS', 'LAST_10_YEARS'] as const

export type ValidTimelineRanges = (typeof validOptions)[number]

function RangePicker(): ReactElement {
    const [value, setValue] = useQueryState(
        'range',
        parseAsStringLiteral(validOptions).withDefault('LAST_1_YEARS').withOptions({
            clearOnDefault: true,
            shallow: false,
        }),
    )

    return (
        <div>
            <Select label="Tidsperiode" value={value} onChange={(e) => setValue(e.target.value as ValidTimelineRanges)}>
                <option value="LAST_1_YEARS">Siste året</option>
                <option value="LAST_3_YEARS">Siste 3 år</option>
                <option value="LAST_10_YEARS">Siste 10 år</option>
            </Select>
        </div>
    )
}

export default RangePicker
