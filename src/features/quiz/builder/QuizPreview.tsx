'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@navikt/aksel-icons'
import { Alert, BodyShort, Button, Modal } from '@navikt/ds-react'
import React, { ReactElement, useState } from 'react'

import { DraftQuestion, QUESTION_TYPES } from '#features/quiz/question-types'
import QuestionStage from '#features/quiz/shared/QuestionStage'
import { PublicQuestion } from '#services/quiz/quiz-schema'

type Props = {
    title: string
    questions: DraftQuestion[]
    defaultTimeLimit: number
    initialIndex: number
    onClose: () => void
}

function toPreviewQuestion(draft: DraftQuestion): PublicQuestion {
    const base = { id: draft.id, text: draft.text || 'Spørsmålstekst', imageId: draft.imageId }
    switch (draft.type) {
        case 'multiple-choice':
            return {
                ...base,
                type: draft.type,
                choices: draft.choices.map((choice, index) => ({
                    id: choice.id,
                    text: choice.text || `Alternativ ${index + 1}`,
                })),
            }
        case 'ordering':
            return {
                ...base,
                type: draft.type,
                items: draft.items.map((item, index) => ({ id: item.id, text: item.text || `Element ${index + 1}` })),
            }
        case 'slider':
            return { ...base, type: draft.type, slider: { min: draft.min, max: draft.max, step: draft.step } }
        case 'text':
            return { ...base, type: draft.type }
    }
}

function PreviewQuestion({ draft }: { draft: DraftQuestion }): ReactElement {
    const [answered, setAnswered] = useState(false)
    const [attempt, setAttempt] = useState(0)
    const question = toPreviewQuestion(draft)
    const PlayInput = QUESTION_TYPES[question.type].PlayInput
    const invalidSlider =
        question.type === 'slider' &&
        (![question.slider.min, question.slider.max, question.slider.step].every(Number.isFinite) ||
            question.slider.min >= question.slider.max ||
            question.slider.step < 1)

    return (
        <div className="flex flex-col gap-4">
            <QuestionStage question={question} />
            {invalidSlider ? (
                <Alert variant="info">
                    Fyll inn gyldig minimum, maksimum og steg for å forhåndsvise glidebryteren.
                </Alert>
            ) : (
                <PlayInput key={attempt} question={question} onAnswer={() => setAnswered(true)} disabled={answered} />
            )}
            {answered && (
                <div className="flex flex-wrap items-center gap-3">
                    <BodyShort>Prøvesvar registrert. Ingen svar blir lagret.</BodyShort>
                    <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => {
                            setAnswered(false)
                            setAttempt((previous) => previous + 1)
                        }}
                    >
                        Prøv igjen
                    </Button>
                </div>
            )}
        </div>
    )
}

function QuizPreview({ title, questions, defaultTimeLimit, initialIndex, onClose }: Props): ReactElement {
    const [index, setIndex] = useState(initialIndex)
    const question = questions[index]

    return (
        <Modal
            open
            onClose={onClose}
            header={{ heading: `Forhåndsvisning: ${title || 'Ny quiz'}` }}
            className="w-[calc(100vw-2rem)] max-w-none h-[calc(100dvh-2rem)] max-h-[calc(100dvh-2rem)]"
        >
            <Modal.Body>
                <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
                    <div className="flex flex-wrap justify-between gap-2 text-ax-text-neutral-subtle">
                        <BodyShort>
                            Spørsmål {index + 1} av {questions.length}
                        </BodyShort>
                        <BodyShort>{question.timeLimitSeconds ?? defaultTimeLimit} sekunder</BodyShort>
                    </div>
                    <PreviewQuestion key={question.id} draft={question} />
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button
                    variant="secondary"
                    icon={<ChevronLeftIcon aria-hidden />}
                    disabled={index === 0}
                    onClick={() => setIndex((previous) => previous - 1)}
                >
                    Forrige spørsmål
                </Button>
                <Button
                    variant="secondary"
                    icon={<ChevronRightIcon aria-hidden />}
                    iconPosition="right"
                    disabled={index === questions.length - 1}
                    onClick={() => setIndex((previous) => previous + 1)}
                >
                    Neste spørsmål
                </Button>
                <Button variant="tertiary" onClick={onClose}>
                    Lukk forhåndsvisning
                </Button>
            </Modal.Footer>
        </Modal>
    )
}

export default QuizPreview
