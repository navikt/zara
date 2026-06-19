'use client'

import React, { ReactElement, useState } from 'react'
import { Button } from '@navikt/ds-react'

import { PlayInputProps } from '@features/quiz/question-types'

function MultipleChoicePlayInput({ question, onAnswer, disabled }: PlayInputProps<'multiple-choice'>): ReactElement {
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const choose = (choiceId: string): void => {
        setSelectedId(choiceId)
        onAnswer({ type: 'multiple-choice', choiceId })
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.choices.map((choice) => (
                <Button
                    key={choice.id}
                    variant={selectedId === choice.id ? 'primary' : 'secondary'}
                    className="justify-start h-auto py-4 text-left"
                    disabled={disabled || selectedId != null}
                    onClick={() => choose(choice.id)}
                >
                    {choice.text}
                </Button>
            ))}
        </div>
    )
}

export default MultipleChoicePlayInput
