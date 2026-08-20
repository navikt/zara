'use client'

import { Button } from '@navikt/ds-react'
import { ReactElement, startTransition } from 'react'

import { skewVakt } from '../kontor-actions'

type Props = {
    year: number
    week: number
    skew: number
}

export function WeekSkewButton({ year, skew, week }: Props): ReactElement {
    return (
        <Button
            size="xsmall"
            variant="secondary-neutral"
            onClick={() => {
                startTransition(async () => {
                    await skewVakt(year, week, skew + 1)
                })
            }}
        >
            Forskyv
        </Button>
    )
}
