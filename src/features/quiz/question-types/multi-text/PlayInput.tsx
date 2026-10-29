'use client'

import { BodyShort, Button, Fieldset, TextField, VStack } from '@navikt/ds-react'
import React, { ReactElement, useState } from 'react'

import { PlayInputProps } from '#features/quiz/question-types'
import { MAX_TEXT_ANSWER_LENGTH } from '#services/quiz/quiz-schema'
import { MAX_POINTS } from '#services/quiz/quiz-scoring'

function MultiTextPlayInput({ question, onAnswer, disabled }: PlayInputProps<'multi-text'>): ReactElement {
    const [texts, setTexts] = useState<string[]>(() => Array.from({ length: question.answerCount }, () => ''))

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                if (!disabled) onAnswer({ type: 'multi-text', texts })
            }}
        >
            <VStack gap="space-12">
                <Fieldset
                    legend={`Skriv ${question.answerCount} ulike svar`}
                    description={`Hvert riktige svar gir en lik andel av ${MAX_POINTS} poeng. Ingen tidsbonus. Rekkefølgen er valgfri, og samme svar teller bare én gang. Store bokstaver og ekstra mellomrom spiller ingen rolle.`}
                >
                    <VStack gap="space-12">
                        {texts.map((text, index) => (
                            <TextField
                                key={index}
                                label={`Svar ${index + 1} av ${question.answerCount}`}
                                value={text}
                                maxLength={MAX_TEXT_ANSWER_LENGTH}
                                disabled={disabled}
                                autoComplete="off"
                                onChange={(event) =>
                                    setTexts((previous) =>
                                        previous.map((value, i) => (i === index ? event.target.value : value)),
                                    )
                                }
                            />
                        ))}
                    </VStack>
                </Fieldset>
                <BodyShort size="small">Du kan la felt stå tomme. Lås svarene før tiden er ute.</BodyShort>
                <Button type="submit" disabled={disabled}>
                    Lås svarene
                </Button>
            </VStack>
        </form>
    )
}

export default MultiTextPlayInput
