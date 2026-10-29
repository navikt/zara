'use client'

import { BodyShort, Button, Fieldset, HStack, TextField, VStack } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { EditorProps } from '#features/quiz/question-types'
import { MAX_MULTI_TEXT_ANSWERS, MAX_MULTI_TEXT_VARIANTS, MAX_TEXT_ANSWER_LENGTH } from '#services/quiz/quiz-schema'
import { MAX_POINTS } from '#services/quiz/quiz-scoring'

function MultiTextEditor({ draft, onChange }: EditorProps<'multi-text'>): ReactElement {
    const { correctAnswers } = draft

    const updateVariants = (index: number, acceptedAnswers: string[]): void =>
        onChange({ correctAnswers: correctAnswers.map((answer, i) => (i === index ? { acceptedAnswers } : answer)) })

    return (
        <VStack gap="space-16">
            <BodyShort>
                Spillerne får ett felt per fasitsvar. Hvert fasitsvar gir en lik andel av {MAX_POINTS} poeng, uten
                tidsbonus. Legg alternative skrivemåter under samme fasitsvar, for eksempel «Frankrike» og «France». Én
                av skrivemåtene er nok. Store bokstaver og ekstra mellomrom spiller ingen rolle.
            </BodyShort>
            {correctAnswers.map((answer, index) => (
                <Fieldset key={index} legend={`Fasitsvar ${index + 1}`}>
                    <VStack gap="space-12">
                        {answer.acceptedAnswers.map((variant, variantIndex) => (
                            <HStack key={variantIndex} gap="space-8" align="end">
                                <TextField
                                    label={`Godkjent skrivemåte ${variantIndex + 1}`}
                                    value={variant}
                                    maxLength={MAX_TEXT_ANSWER_LENGTH}
                                    className="grow"
                                    onChange={(event) =>
                                        updateVariants(
                                            index,
                                            answer.acceptedAnswers.map((value, i) =>
                                                i === variantIndex ? event.target.value : value,
                                            ),
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="small"
                                    aria-label={`Fjern skrivemåte ${variantIndex + 1} fra fasitsvar ${index + 1}`}
                                    disabled={answer.acceptedAnswers.length <= 1}
                                    onClick={() =>
                                        updateVariants(
                                            index,
                                            answer.acceptedAnswers.filter((_, i) => i !== variantIndex),
                                        )
                                    }
                                >
                                    Fjern skrivemåte
                                </Button>
                            </HStack>
                        ))}
                        <HStack gap="space-8">
                            {answer.acceptedAnswers.length < MAX_MULTI_TEXT_VARIANTS && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="small"
                                    aria-label={`Legg til skrivemåte for fasitsvar ${index + 1}`}
                                    onClick={() => updateVariants(index, [...answer.acceptedAnswers, ''])}
                                >
                                    Legg til skrivemåte
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="secondary"
                                size="small"
                                aria-label={`Fjern fasitsvar ${index + 1}`}
                                disabled={correctAnswers.length <= 2}
                                onClick={() =>
                                    onChange({ correctAnswers: correctAnswers.filter((_, i) => i !== index) })
                                }
                            >
                                Fjern fasitsvar
                            </Button>
                        </HStack>
                    </VStack>
                </Fieldset>
            ))}
            {correctAnswers.length < MAX_MULTI_TEXT_ANSWERS && (
                <div>
                    <Button
                        type="button"
                        variant="secondary"
                        size="small"
                        onClick={() => onChange({ correctAnswers: [...correctAnswers, { acceptedAnswers: [''] }] })}
                    >
                        Legg til fasitsvar
                    </Button>
                </div>
            )}
        </VStack>
    )
}

export default MultiTextEditor
