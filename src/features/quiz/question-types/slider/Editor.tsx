'use client'

import React, { ReactElement } from 'react'
import { TextField } from '@navikt/ds-react'

import { DraftSlider, EditorProps } from '@features/quiz/question-types'

type NumberKey = 'min' | 'max' | 'step' | 'correct' | 'tolerance'

function SliderEditor({ draft, onChange }: EditorProps<'slider'>): ReactElement {
    const numberField = (label: string, key: NumberKey): ReactElement => {
        const patch = (value: number): Partial<DraftSlider> => ({ [key]: value })
        return (
            <TextField
                label={label}
                type="number"
                className="max-w-[10rem]"
                value={Number.isNaN(draft[key]) ? '' : String(draft[key])}
                onChange={(e) => onChange(patch(e.target.value === '' ? NaN : Number(e.target.value)))}
            />
        )
    }

    return (
        <div className="flex flex-wrap gap-4">
            {numberField('Minimum', 'min')}
            {numberField('Maksimum', 'max')}
            {numberField('Steg', 'step')}
            {numberField('Riktig verdi', 'correct')}
            {numberField('Toleranse (± for fullt poeng)', 'tolerance')}
        </div>
    )
}

export default SliderEditor
