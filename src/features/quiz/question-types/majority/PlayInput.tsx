'use client'

import { BodyShort, Button } from '@navikt/ds-react'
import React, { ReactElement, useState } from 'react'

import { PlayInputProps } from '#features/quiz/question-types'

function MajorityPlayInput({ question, onAnswer, disabled }: PlayInputProps<'majority'>): ReactElement {
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const choose = (optionId: string): void => {
        setSelectedId(optionId)
        onAnswer({ type: 'majority', optionId })
    }

    return (
        <div className="flex flex-col gap-3">
            <BodyShort size="small" className="text-center text-ax-text-neutral-subtle">
                🧠 Ikke svar det <em>du</em> mener – svar det du tror <strong>flertallet</strong> velger.
            </BodyShort>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {question.options.map((option) => (
                    <Button
                        key={option.id}
                        variant={selectedId === option.id ? 'primary' : 'secondary'}
                        className="justify-start h-auto py-4 text-left"
                        disabled={disabled || selectedId != null}
                        onClick={() => choose(option.id)}
                    >
                        {option.text}
                    </Button>
                ))}
            </div>
        </div>
    )
}

export default MajorityPlayInput
