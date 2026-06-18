'use client'

import React, { ReactElement } from 'react'
import { BodyShort, Heading } from '@navikt/ds-react'

import { RevealProps } from '@features/quiz/question-types'

function SliderReveal({ data, results, myResult }: RevealProps<'slider'>): ReactElement {
    const myValue = myResult?.answer?.type === 'slider' ? myResult.answer.value : null
    const guesses = results.flatMap((r) => (r.answer?.type === 'slider' ? [r.answer.value] : []))
    const average = guesses.length > 0 ? guesses.reduce((a, b) => a + b, 0) / guesses.length : null

    return (
        <div className="flex flex-col gap-2">
            <Heading level="3" size="small">
                Riktig verdi: <span className="tabular-nums">{data.correctValue}</span>
            </Heading>
            {myValue != null && (
                <BodyShort>
                    Du gjettet <span className="tabular-nums font-semibold">{myValue}</span>.
                </BodyShort>
            )}
            {average != null && (
                <BodyShort size="small" className="text-ax-text-neutral-subtle">
                    Snittgjett: <span className="tabular-nums">{Math.round(average * 10) / 10}</span> ({guesses.length}{' '}
                    svar)
                </BodyShort>
            )}
        </div>
    )
}

export default SliderReveal
