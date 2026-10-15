'use client'

import { ChevronLeftIcon, ChevronRightIcon } from '@navikt/aksel-icons'
import { Alert, BodyShort, Button, Modal } from '@navikt/ds-react'
import React, { ReactElement, useState } from 'react'

import { DraftQuestion, QUESTION_TYPES, draftToQuestion } from '#features/quiz/question-types'
import QuestionStage from '#features/quiz/shared/QuestionStage'
import { gradeAnswer } from '#services/quiz/quiz-grading'
import {
    AnswerPayload,
    PublicQuestion,
    Question,
    QuestionSchema,
    RevealData,
    RevealResult,
} from '#services/quiz/quiz-schema'

type Props = {
    title: string
    questions: DraftQuestion[]
    defaultTimeLimit: number
    initialIndex: number
    onClose: () => void
}

function shuffle<T>(items: T[]): T[] {
    const shuffled = [...items]
    for (let index = shuffled.length - 1; index > 0; index--) {
        const other = Math.floor(Math.random() * (index + 1))
        ;[shuffled[index], shuffled[other]] = [shuffled[other], shuffled[index]]
    }
    return shuffled
}

function toPreviewQuestion(draft: DraftQuestion): PublicQuestion {
    const base = { id: draft.id, text: draft.text || 'Spørsmålstekst', imageId: draft.imageId }
    switch (draft.type) {
        case 'multiple-choice': {
            const choices = draft.choices.map((choice, index) => ({
                id: choice.id,
                text: choice.text || `Alternativ ${index + 1}`,
            }))
            return {
                ...base,
                type: draft.type,
                choices: draft.shuffleChoices ? shuffle(choices) : choices,
            }
        }
        case 'ordering':
            return {
                ...base,
                type: draft.type,
                items: shuffle(
                    draft.items.map((item, index) => ({ id: item.id, text: item.text || `Element ${index + 1}` })),
                ),
            }
        case 'slider':
            return { ...base, type: draft.type, slider: { min: draft.min, max: draft.max, step: draft.step } }
        case 'text':
            return { ...base, type: draft.type }
    }
}

function previewRevealData(question: Question): RevealData {
    switch (question.type) {
        case 'multiple-choice':
            return { type: question.type, correctChoiceId: question.choices.find((choice) => choice.correct)?.id ?? '' }
        case 'ordering':
            return { type: question.type, correctOrder: question.items.map((item) => item.id) }
        case 'slider':
            return { type: question.type, correctValue: question.correct }
        case 'text':
            return { type: question.type, acceptedAnswers: question.acceptedAnswers }
    }
}

function PreviewQuestion({ draft }: { draft: DraftQuestion }): ReactElement {
    const [answer, setAnswer] = useState<AnswerPayload | null>(null)
    const [attempt, setAttempt] = useState(0)
    const [question, setQuestion] = useState(() => toPreviewQuestion(draft))
    const PlayInput = QUESTION_TYPES[question.type].PlayInput
    const Reveal = QUESTION_TYPES[question.type].Reveal
    const parsed = QuestionSchema.safeParse(draftToQuestion(draft))
    const result: RevealResult | null =
        answer && parsed.success ? { playerId: 'preview', answer, ...gradeAnswer(parsed.data, answer, 0, 0) } : null
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
                !answer && <PlayInput key={attempt} question={question} onAnswer={setAnswer} disabled={false} />
            )}
            {result && parsed.success && (
                <>
                    <Alert variant={result.correct ? 'success' : result.accuracy > 0 ? 'info' : 'error'}>
                        {result.correct
                            ? 'Riktig svar!'
                            : result.accuracy > 0
                              ? `Delvis riktig (${Math.round(result.accuracy * 100)} %).`
                              : 'Feil svar.'}
                    </Alert>
                    <Reveal
                        question={question}
                        data={previewRevealData(parsed.data)}
                        results={[result]}
                        myResult={result}
                    />
                </>
            )}
            {answer && !parsed.success && (
                <Alert variant="warning">
                    Spørsmålet er ikke ferdig utfylt. Fyll inn gyldige svar og fasit i redigeringsvinduet for å
                    kontrollere svaret.
                </Alert>
            )}
            {answer && (
                <div className="flex flex-wrap items-center gap-3">
                    <BodyShort>Ingen prøvesvar eller poeng blir lagret.</BodyShort>
                    <Button
                        variant="tertiary"
                        size="small"
                        onClick={() => {
                            setAnswer(null)
                            setQuestion(toPreviewQuestion(draft))
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
