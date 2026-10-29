'use client'

import { BodyShort, Heading, VStack } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { RevealProps } from '#features/quiz/question-types'
import { matchTextAnswerGroups } from '#services/quiz/quiz-text'

function MultiTextReveal({ data, myResult }: RevealProps<'multi-text'>): ReactElement {
    const myTexts = myResult?.answer?.type === 'multi-text' ? myResult.answer.texts : null
    const matches = matchTextAnswerGroups(data.correctAnswers, myTexts ?? [])
    const matchedCount = matches.filter(Boolean).length

    return (
        <VStack gap="space-8">
            <Heading level="3" size="small">
                Riktige svar
            </Heading>
            <ul className="list-disc pl-6">
                {data.correctAnswers.map((answer, index) => (
                    <li key={answer.acceptedAnswers[0]}>
                        {answer.acceptedAnswers.join(' / ')}
                        {myTexts != null && (matches[index] ? ' – riktig' : ' – manglet')}
                    </li>
                ))}
            </ul>
            {myTexts != null && (
                <>
                    <BodyShort>
                        Du fant {matchedCount} av {data.correctAnswers.length} riktige svar.
                    </BodyShort>
                    <BodyShort>Du svarte: {myTexts.filter((text) => text.trim()).join(', ') || 'Ingen svar'}</BodyShort>
                </>
            )}
        </VStack>
    )
}

export default MultiTextReveal
