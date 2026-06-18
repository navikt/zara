'use client'

import React, { ReactElement } from 'react'
import { Button, Select, TextField } from '@navikt/ds-react'
import { PlusIcon, TrashIcon } from '@navikt/aksel-icons'

import { EditorProps } from '@features/quiz/question-types'

const FUZZ_OPTIONS: { value: 'off' | 'low' | 'medium'; label: string }[] = [
    { value: 'off', label: 'Av (eksakt treff)' },
    { value: 'low', label: 'Lav (tillat én skrivefeil)' },
    { value: 'medium', label: 'Middels (tillat to skrivefeil)' },
]

function TextEditor({ draft, onChange }: EditorProps<'text'>): ReactElement {
    const { acceptedAnswers, fuzz } = draft

    const updateAnswer = (index: number, value: string): void =>
        onChange({ acceptedAnswers: acceptedAnswers.map((a, i) => (i === index ? value : a)) })

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
                {acceptedAnswers.map((answer, index) => (
                    <div key={index} className="flex items-center gap-2">
                        <TextField
                            label={`Godkjent svar ${index + 1}`}
                            hideLabel
                            className="grow"
                            value={answer}
                            onChange={(e) => updateAnswer(index, e.target.value)}
                        />
                        <Button
                            variant="tertiary"
                            size="small"
                            icon={<TrashIcon aria-hidden />}
                            title="Fjern"
                            disabled={acceptedAnswers.length <= 1}
                            onClick={() => onChange({ acceptedAnswers: acceptedAnswers.filter((_, i) => i !== index) })}
                        />
                    </div>
                ))}
            </div>
            {acceptedAnswers.length < 10 && (
                <div>
                    <Button
                        variant="secondary"
                        size="small"
                        icon={<PlusIcon aria-hidden />}
                        onClick={() => onChange({ acceptedAnswers: [...acceptedAnswers, ''] })}
                    >
                        Legg til godkjent svar
                    </Button>
                </div>
            )}
            <Select
                label="Skrivefeil-toleranse"
                className="max-w-xs"
                value={fuzz}
                onChange={(e) => onChange({ fuzz: e.target.value as 'off' | 'low' | 'medium' })}
            >
                {FUZZ_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </Select>
        </div>
    )
}

export default TextEditor
