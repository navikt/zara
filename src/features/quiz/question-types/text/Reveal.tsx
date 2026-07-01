'use client'

import { BodyShort, Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { RevealProps } from '#features/quiz/question-types'

function TextReveal({ data, myResult }: RevealProps<'text'>): ReactElement {
    const myText = myResult?.answer?.type === 'text' ? myResult.answer.text : null

    return (
        <div className="flex flex-col gap-2">
            <Heading level="3" size="small">
                Godkjente svar
            </Heading>
            <div className="flex flex-wrap gap-2">
                {data.acceptedAnswers.map((answer, index) => (
                    <span
                        key={index}
                        className="px-3 py-1 rounded-md border-2 border-ax-border-success bg-ax-bg-success-moderate"
                    >
                        {answer}
                    </span>
                ))}
            </div>
            {myText != null && (
                <BodyShort>
                    Du svarte: <span className="font-semibold">{myText}</span>
                </BodyShort>
            )}
        </div>
    )
}

export default TextReveal
