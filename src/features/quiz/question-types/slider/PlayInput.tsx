'use client'

import { Button } from '@navikt/ds-react'
import React, { ReactElement, useState } from 'react'

import { PlayInputProps } from '#features/quiz/question-types'

function SliderPlayInput({ question, onAnswer, disabled }: PlayInputProps<'slider'>): ReactElement {
    const { min, max, step } = question.slider
    const [value, setValue] = useState<number>(Math.round((min + max) / 2))

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
                <span className="tabular-nums text-ax-text-neutral-subtle">{min}</span>
                <input
                    type="range"
                    className="grow accent-ax-bg-accent-strong"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    disabled={disabled}
                    onChange={(e) => setValue(Number(e.target.value))}
                />
                <span className="tabular-nums text-ax-text-neutral-subtle">{max}</span>
            </div>
            <p className="text-center text-3xl font-bold tabular-nums">{value}</p>
            <Button onClick={() => onAnswer({ type: 'slider', value })} disabled={disabled}>
                Lås svaret
            </Button>
        </div>
    )
}

export default SliderPlayInput
