'use client'

import React, { ReactElement, useRef, useState, useTransition } from 'react'
import { Alert, Button, Heading, Select, TextField } from '@navikt/ds-react'
import { ImageIcon, PlusIcon, TrashIcon } from '@navikt/aksel-icons'
import { useRouter } from 'next/navigation'

import { QuestionType, QuizContent } from '@services/quiz/quiz-schema'
import { saveExistingQuiz, saveNewQuiz } from '@features/quiz/quiz-actions'
import { uploadQuizImage } from '@features/quiz/image-actions'
import { resizeImageForUpload } from '@features/quiz/resize-image'
import {
    DraftBase,
    DraftQuestion,
    QUESTION_TYPES,
    QUESTION_TYPE_ORDER,
    draftToQuestion,
    questionToDraft,
} from '@features/quiz/question-types'

const TIME_LIMIT_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120]

type Props = {
    /** When present, we're editing an existing quiz (content already decrypted by the edit gate). */
    existing?: { id: string; content: QuizContent; defaultTimeLimit: number }
}

function blankBase(): DraftBase {
    return { id: crypto.randomUUID(), text: '', timeLimitSeconds: null, imageId: null }
}

function blankQuestion(): DraftQuestion {
    return QUESTION_TYPES['multiple-choice'].blankDraft(blankBase())
}

/** Per-type validation of the type-specific fields. Returns an error message or null. */
function validateTypeFields(draft: DraftQuestion): string | null {
    switch (draft.type) {
        case 'multiple-choice':
            if (draft.choices.length < 2) return 'må ha minst to svaralternativer.'
            if (draft.choices.some((c) => c.text.trim().length === 0)) return 'har et tomt svaralternativ.'
            if (draft.choices.filter((c) => c.correct).length !== 1) return 'må ha nøyaktig ett riktig svar.'
            return null
        case 'ordering':
            if (draft.items.length < 3) return 'må ha minst tre elementer.'
            if (draft.items.some((it) => it.text.trim().length === 0)) return 'har et tomt element.'
            return null
        case 'slider':
            if (![draft.min, draft.max, draft.step, draft.correct, draft.tolerance].every(Number.isFinite))
                return 'mangler tallverdier for glidebryteren.'
            if (draft.min >= draft.max) return 'må ha minimum mindre enn maksimum.'
            if (draft.step < 1) return 'må ha et steg på minst 1.'
            if (draft.correct < draft.min || draft.correct > draft.max)
                return 'må ha riktig verdi innenfor min og maks.'
            if (draft.tolerance <= 0) return 'må ha en toleranse større enn 0.'
            return null
        case 'text': {
            const filled = draft.acceptedAnswers.filter((a) => a.trim().length > 0)
            if (filled.length === 0) return 'må ha minst ett godkjent svar.'
            return null
        }
    }
}

/** Per-question image upload + preview. Uploads via the server action and reports the new id. */
function ImagePicker({
    imageId,
    onChange,
}: {
    imageId: string | null
    onChange: (imageId: string | null) => void
}): ReactElement {
    const inputRef = useRef<HTMLInputElement>(null)
    const [isUploading, startUpload] = useTransition()
    const [uploadError, setUploadError] = useState<string | null>(null)

    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0]
        // Allow re-selecting the same file later.
        e.target.value = ''
        if (!file) return

        setUploadError(null)
        startUpload(async () => {
            // Downscale large images in the browser so big phone photos don't hit the upload size limit.
            const resized = await resizeImageForUpload(file)
            const formData = new FormData()
            formData.append('file', resized)
            const result = await uploadQuizImage(formData)
            if ('error' in result) {
                setUploadError(result.error)
            } else {
                onChange(result.imageId)
            }
        })
    }

    return (
        <div className="flex flex-col gap-2">
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
            <div className="flex flex-wrap items-center gap-2">
                <Button
                    type="button"
                    variant="secondary"
                    size="small"
                    icon={<ImageIcon aria-hidden />}
                    loading={isUploading}
                    onClick={() => inputRef.current?.click()}
                >
                    {imageId ? 'Bytt bilde' : 'Legg til bilde'}
                </Button>
                {imageId && (
                    <Button
                        type="button"
                        variant="tertiary"
                        size="small"
                        icon={<TrashIcon aria-hidden />}
                        onClick={() => {
                            setUploadError(null)
                            onChange(null)
                        }}
                    >
                        Fjern bilde
                    </Button>
                )}
            </div>
            {imageId && (
                // next/image does NOT enjoy auth-gated images that might 404, it spams the logs
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={`/quiz/image/${imageId}`}
                    alt=""
                    className="max-h-32 w-auto max-w-full self-start object-contain rounded-md"
                />
            )}
            {uploadError && <Alert variant="error">{uploadError}</Alert>}
        </div>
    )
}

function QuizBuilder({ existing }: Props): ReactElement {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [passphrase, setPassphrase] = useState('')

    const [title, setTitle] = useState(existing?.content.title ?? '')
    const [defaultTimeLimit, setDefaultTimeLimit] = useState(existing?.defaultTimeLimit ?? 20)
    const [questions, setQuestions] = useState<DraftQuestion[]>(
        existing?.content.questions.map(questionToDraft) ?? [blankQuestion()],
    )

    const updateQuestion = (id: string, patch: Partial<DraftQuestion>): void =>
        setQuestions((prev) => prev.map((q) => (q.id === id ? ({ ...q, ...patch } as DraftQuestion) : q)))

    /** Switch a question to another type, re-seeding the type-specific defaults but keeping shared fields. */
    const changeType = (id: string, type: QuestionType): void =>
        setQuestions((prev) =>
            prev.map((q) => {
                if (q.id !== id || q.type === type) return q
                const base: DraftBase = {
                    id: q.id,
                    text: q.text,
                    timeLimitSeconds: q.timeLimitSeconds,
                    imageId: q.imageId,
                }
                return QUESTION_TYPES[type].blankDraft(base)
            }),
        )

    const validate = (): QuizContent | null => {
        if (title.trim().length === 0) {
            setError('Quizen må ha en tittel.')
            return null
        }
        for (const [i, q] of questions.entries()) {
            if (q.text.trim().length === 0) {
                setError(`Spørsmål ${i + 1} mangler tekst.`)
                return null
            }
            const typeError = validateTypeFields(q)
            if (typeError) {
                setError(`Spørsmål ${i + 1} ${typeError}`)
                return null
            }
        }

        return {
            title: title.trim(),
            questions: questions.map(draftToQuestion),
        }
    }

    const save = (): void => {
        setError(null)
        const content = validate()
        if (!content) return
        if (passphrase.trim().length < 4) {
            setError('Velg en passordfrase på minst 4 tegn for å kryptere quizen.')
            return
        }

        startTransition(async () => {
            if (existing) {
                await saveExistingQuiz(existing.id, content, defaultTimeLimit, passphrase)
            } else {
                await saveNewQuiz(content, defaultTimeLimit, passphrase)
            }
            router.push('/quiz')
        })
    }

    return (
        <div className="flex flex-col gap-6 max-w-3xl">
            <div className="flex flex-col gap-4 bg-ax-bg-raised p-4 rounded-md">
                <TextField label="Tittel" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Select
                    label="Standard tid per spørsmål"
                    className="max-w-xs"
                    value={defaultTimeLimit}
                    onChange={(e) => setDefaultTimeLimit(Number(e.target.value))}
                >
                    {TIME_LIMIT_OPTIONS.map((seconds) => (
                        <option key={seconds} value={seconds}>
                            {seconds} sekunder
                        </option>
                    ))}
                </Select>
            </div>

            {questions.map((question, index) => {
                const Editor = QUESTION_TYPES[question.type].Editor
                return (
                    <div key={question.id} className="flex flex-col gap-4 bg-ax-bg-raised p-4 rounded-md">
                        <div className="flex justify-between items-center">
                            <Heading level="3" size="small">
                                Spørsmål {index + 1}
                            </Heading>
                            <Button
                                variant="tertiary"
                                size="small"
                                icon={<TrashIcon aria-hidden />}
                                disabled={questions.length <= 1}
                                onClick={() => setQuestions((prev) => prev.filter((q) => q.id !== question.id))}
                            >
                                Fjern
                            </Button>
                        </div>

                        <TextField
                            label="Spørsmålstekst"
                            value={question.text}
                            onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                        />

                        <ImagePicker
                            imageId={question.imageId}
                            onChange={(imageId) => updateQuestion(question.id, { imageId })}
                        />

                        <div className="flex flex-wrap gap-4">
                            <Select
                                label="Type spørsmål"
                                className="max-w-xs"
                                value={question.type}
                                onChange={(e) => changeType(question.id, e.target.value as QuestionType)}
                            >
                                {QUESTION_TYPE_ORDER.map((type) => (
                                    <option key={type} value={type}>
                                        {QUESTION_TYPES[type].label}
                                    </option>
                                ))}
                            </Select>

                            <Select
                                label="Tid for dette spørsmålet"
                                className="max-w-xs"
                                value={question.timeLimitSeconds ?? 'default'}
                                onChange={(e) =>
                                    updateQuestion(question.id, {
                                        timeLimitSeconds: e.target.value === 'default' ? null : Number(e.target.value),
                                    })
                                }
                            >
                                <option value="default">Bruk standard ({defaultTimeLimit}s)</option>
                                {TIME_LIMIT_OPTIONS.map((seconds) => (
                                    <option key={seconds} value={seconds}>
                                        {seconds} sekunder
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <Editor
                            draft={question}
                            onChange={(patch) => updateQuestion(question.id, patch as Partial<DraftQuestion>)}
                        />
                    </div>
                )
            })}

            <div>
                <Button
                    variant="secondary"
                    icon={<PlusIcon aria-hidden />}
                    onClick={() => setQuestions((prev) => [...prev, blankQuestion()])}
                >
                    Legg til spørsmål
                </Button>
            </div>

            <div className="flex flex-col gap-2 bg-ax-bg-raised p-4 rounded-md">
                <TextField
                    label="Passordfrase (krypterer quizen)"
                    type="password"
                    description="Kreves for å redigere og starte quizen senere. Kan ikke gjenopprettes om du glemmer den."
                    className="max-w-sm"
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                />
            </div>

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex gap-2">
                <Button onClick={save} loading={isPending}>
                    {existing ? 'Lagre endringer' : 'Lagre quiz'}
                </Button>
                <Button variant="secondary" onClick={() => router.push('/quiz')} disabled={isPending}>
                    Avbryt
                </Button>
            </div>
        </div>
    )
}

export default QuizBuilder
