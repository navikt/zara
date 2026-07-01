'use client'

import { PlusIcon, TrashIcon } from '@navikt/aksel-icons'
import { Button, Radio, RadioGroup, TextField } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { EditorProps } from '#features/quiz/question-types'
import { Choice } from '#services/quiz/quiz-schema'

function blankChoice(correct = false): Choice {
    return { id: crypto.randomUUID(), text: '', correct }
}

function MultipleChoiceEditor({ draft, onChange }: EditorProps<'multiple-choice'>): ReactElement {
    const { choices } = draft

    const updateChoice = (id: string, patch: Partial<Choice>): void =>
        onChange({ choices: choices.map((c) => (c.id === id ? { ...c, ...patch } : c)) })

    const setCorrect = (id: string): void => onChange({ choices: choices.map((c) => ({ ...c, correct: c.id === id })) })

    return (
        <>
            <RadioGroup
                legend="Svaralternativer (velg det riktige)"
                value={choices.find((c) => c.correct)?.id ?? ''}
                onChange={(value: string) => setCorrect(value)}
            >
                <div className="flex flex-col gap-2">
                    {choices.map((choice, index) => (
                        <div key={choice.id} className="flex items-center gap-2">
                            <Radio value={choice.id}>
                                {/* Radio has no `hideLabel`; keep the a11y name but hide it visually. */}
                                <span className="sr-only">Riktig svar {index + 1}</span>
                            </Radio>
                            <TextField
                                label={`Alternativ ${index + 1}`}
                                hideLabel
                                className="grow"
                                value={choice.text}
                                onChange={(e) => updateChoice(choice.id, { text: e.target.value })}
                            />
                            <Button
                                variant="tertiary"
                                size="small"
                                icon={<TrashIcon aria-hidden />}
                                disabled={choices.length <= 2}
                                onClick={() => onChange({ choices: choices.filter((c) => c.id !== choice.id) })}
                            />
                        </div>
                    ))}
                </div>
            </RadioGroup>

            {choices.length < 4 && (
                <div>
                    <Button
                        variant="secondary"
                        size="small"
                        icon={<PlusIcon aria-hidden />}
                        onClick={() => onChange({ choices: [...choices, blankChoice()] })}
                    >
                        Legg til alternativ
                    </Button>
                </div>
            )}
        </>
    )
}

export default MultipleChoiceEditor
