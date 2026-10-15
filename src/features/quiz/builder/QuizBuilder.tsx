'use client'

import { ChevronDownIcon, ChevronUpIcon, ImageIcon, PlusIcon, TrashIcon } from '@navikt/aksel-icons'
import { Alert, Button, Heading, Select, TextField } from '@navikt/ds-react'
import { useRouter } from 'next/navigation'
import React, { ReactElement, useEffect, useEffectEvent, useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'

import { uploadQuizImage } from '#features/quiz/image-actions'
import { MAX_QUIZ_IMAGE_SIZE_BYTES } from '#features/quiz/image-limits'
import {
    DraftBase,
    DraftQuestion,
    QUESTION_TYPES,
    QUESTION_TYPE_ORDER,
    draftToQuestion,
    questionToDraft,
} from '#features/quiz/question-types'
import { move } from '#features/quiz/question-types/ordering/move'
import { saveExistingQuiz, saveNewQuiz } from '#features/quiz/quiz-actions'
import { resizeImageForUpload } from '#features/quiz/resize-image'
import { QuestionType, QuizContent } from '#services/quiz/quiz-schema'

const TIME_LIMIT_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120]

type Props = {
    /** When present, we're editing an existing quiz (content already decrypted by the edit gate). */
    existing?: { id: string; content: QuizContent; defaultTimeLimit: number }
    /** Seeds a brand-new quiz from an existing one (duplicating). Ignored when `existing` is set. */
    template?: { content: QuizContent; defaultTimeLimit: number }
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
    questionText,
    onQuestionTextChange,
    imageId,
    onChange,
}: {
    questionText: string
    onQuestionTextChange: (text: string) => void
    imageId: string | null
    onChange: (imageId: string | null) => void
}): ReactElement {
    const inputRef = useRef<HTMLInputElement>(null)
    const questionTextRef = useRef<HTMLInputElement>(null)
    const imageButtonRef = useRef<HTMLButtonElement>(null)
    const isReadingClipboard = useRef(false)
    const [isUploading, startUpload] = useTransition()
    const [uploadError, setUploadError] = useState<string | null>(null)

    const upload = (file: File): void => {
        if (isUploading) return
        setUploadError(null)
        startUpload(async () => {
            try {
                // Downscale large images in the browser so big phone photos don't hit the upload size limit.
                const resized = await resizeImageForUpload(file)
                if (resized.size > MAX_QUIZ_IMAGE_SIZE_BYTES) {
                    setUploadError('Bildet er for stort. Maks 2 MB etter komprimering. Prøv et mindre bilde.')
                    return
                }
                const formData = new FormData()
                formData.append('file', resized)
                const result = await uploadQuizImage(formData)
                if ('error' in result) {
                    setUploadError(result.error)
                } else {
                    onChange(result.imageId)
                }
            } catch {
                setUploadError('Bildet kunne ikke lastes opp. Prøv igjen.')
            }
        })
    }

    const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const file = e.target.files?.[0]
        // Allow re-selecting the same file later.
        e.target.value = ''
        if (file) upload(file)
    }

    const onPaste = (event: React.ClipboardEvent<HTMLDivElement>): void => {
        if (event.target !== questionTextRef.current && event.target !== imageButtonRef.current) return
        if (isReadingClipboard.current) {
            event.preventDefault()
            return
        }
        const image = Array.from(event.clipboardData.items)
            .find((item) => item.kind === 'file' && item.type.startsWith('image/'))
            ?.getAsFile()
        if (!image) return
        event.preventDefault()
        upload(image)
    }

    const onImageButtonKeyDown = async (event: React.KeyboardEvent<HTMLButtonElement>): Promise<void> => {
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'v' || event.altKey) return
        // Buttons don't reliably receive native paste events. Read within this user gesture instead.
        event.preventDefault()
        if (event.repeat || isUploading || isReadingClipboard.current) return
        isReadingClipboard.current = true
        setUploadError(null)
        try {
            const items = await navigator.clipboard.read()
            for (const item of items) {
                const type = item.types.find((type) => type.startsWith('image/'))
                if (!type) continue
                const blob = await item.getType(type)
                upload(new File([blob], 'clipboard-image', { type }))
                return
            }
        } catch {
            setUploadError('Kunne ikke lese bildet fra utklippstavlen. Prøv å lime inn i spørsmålsteksten.')
        } finally {
            isReadingClipboard.current = false
        }
    }

    return (
        <div className="flex flex-col gap-4" onPaste={onPaste}>
            <TextField
                ref={questionTextRef}
                label="Spørsmålstekst"
                value={questionText}
                onChange={(event) => onQuestionTextChange(event.target.value)}
            />
            <div className="flex flex-col gap-2">
                <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileSelected} />
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        ref={imageButtonRef}
                        type="button"
                        variant="secondary"
                        size="small"
                        icon={<ImageIcon aria-hidden />}
                        loading={isUploading}
                        onClick={() => inputRef.current?.click()}
                        onKeyDown={onImageButtonKeyDown}
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
        </div>
    )
}

function QuizBuilder({ existing, template }: Props): ReactElement {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [quizId, setQuizId] = useState(existing?.id)

    // Editing wins over duplicating; a duplicate is seeded from the source but saved as a new quiz.
    const seed = existing ?? template ?? null

    const [title, setTitle] = useState(existing?.content.title ?? (template ? `${template.content.title} (kopi)` : ''))
    const [defaultTimeLimit, setDefaultTimeLimit] = useState(seed?.defaultTimeLimit ?? 20)
    const [questions, setQuestions] = useState<DraftQuestion[]>(
        seed?.content.questions.map(questionToDraft) ?? [blankQuestion()],
    )

    const updateQuestion = (id: string, patch: Partial<DraftQuestion>): void =>
        setQuestions((prev) => prev.map((q) => (q.id === id ? ({ ...q, ...patch } as DraftQuestion) : q)))

    const insertQuestionBefore = (id: string): void => {
        const question = blankQuestion()
        setQuestions((prev) => {
            const index = prev.findIndex((q) => q.id === id)
            if (index === -1) return prev
            return [...prev.slice(0, index), question, ...prev.slice(index)]
        })
    }

    const moveQuestion = (id: string, direction: -1 | 1): void =>
        setQuestions((prev) => {
            const index = prev.findIndex((q) => q.id === id)
            return index === -1 ? prev : move(prev, index, index + direction)
        })

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

    const reportSaveError = (message: string): void => {
        setError(message)
        toast.custom(
            () => (
                <Alert variant="error" size="small">
                    {message}
                </Alert>
            ),
            { id: 'quiz-save-error', duration: 8000 },
        )
    }

    const validate = (): QuizContent | null => {
        if (title.trim().length === 0) {
            reportSaveError('Quizen må ha en tittel.')
            return null
        }
        for (const [i, q] of questions.entries()) {
            if (q.text.trim().length === 0) {
                reportSaveError(`Spørsmål ${i + 1} mangler tekst.`)
                return null
            }
            const typeError = validateTypeFields(q)
            if (typeError) {
                reportSaveError(`Spørsmål ${i + 1} ${typeError}`)
                return null
            }
        }

        return {
            title: title.trim(),
            questions: questions.map(draftToQuestion),
        }
    }

    const save = (closeAfterSave: boolean): void => {
        if (isPending) return
        setError(null)
        toast.dismiss('quiz-save-error')
        const content = validate()
        if (!content) return

        startTransition(async () => {
            try {
                if (quizId) {
                    const { ok } = await saveExistingQuiz(quizId, content, defaultTimeLimit)
                    if (!ok) {
                        reportSaveError(
                            'Quizen kunne ikke lagres. Er den allerede spilt, er den delt med teamet og låst.',
                        )
                        return
                    }
                } else {
                    const { id } = await saveNewQuiz(content, defaultTimeLimit)
                    setQuizId(id)
                    if (!closeAfterSave) router.replace(`/quiz/${id}/edit`, { scroll: false })
                }
                if (closeAfterSave) {
                    router.push('/quiz')
                } else {
                    toast.custom(() => (
                        <Alert variant="success" size="small">
                            Endringene er lagret.
                        </Alert>
                    ))
                }
            } catch {
                reportSaveError(
                    'Quizen kunne ikke lagres. Prøv igjen. Endringene dine er fortsatt i redigeringsvinduet.',
                )
            }
        })
    }

    const saveFromShortcut = useEffectEvent(() => save(false))

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent): void => {
            if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 's' || event.altKey) return
            event.preventDefault()
            if (!event.repeat) saveFromShortcut()
        }

        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [])

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
                    <React.Fragment key={question.id}>
                        {index > 0 && (
                            <div className="group flex items-center gap-3 -my-4 py-2">
                                <span aria-hidden className="h-px flex-1 bg-ax-border-neutral-subtle" />
                                <Button
                                    type="button"
                                    variant="tertiary"
                                    size="small"
                                    icon={<PlusIcon aria-hidden />}
                                    className="opacity-40 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
                                    aria-label={`Legg til spørsmål mellom spørsmål ${index} og ${index + 1}`}
                                    disabled={isPending}
                                    onClick={() => insertQuestionBefore(question.id)}
                                >
                                    Legg til spørsmål her
                                </Button>
                                <span aria-hidden className="h-px flex-1 bg-ax-border-neutral-subtle" />
                            </div>
                        )}
                        <div className="flex flex-col gap-4 bg-ax-bg-raised p-4 rounded-md">
                            <div className="flex flex-wrap justify-between items-center gap-2">
                                <Heading level="3" size="small">
                                    Spørsmål {index + 1}
                                </Heading>
                                <div className="flex flex-wrap gap-2">
                                    <Button
                                        variant="tertiary"
                                        size="small"
                                        icon={<ChevronUpIcon aria-hidden />}
                                        aria-label={`Flytt spørsmål ${index + 1} opp`}
                                        disabled={index === 0 || isPending}
                                        onClick={() => moveQuestion(question.id, -1)}
                                    >
                                        Flytt opp
                                    </Button>
                                    <Button
                                        variant="tertiary"
                                        size="small"
                                        icon={<ChevronDownIcon aria-hidden />}
                                        aria-label={`Flytt spørsmål ${index + 1} ned`}
                                        disabled={index === questions.length - 1 || isPending}
                                        onClick={() => moveQuestion(question.id, 1)}
                                    >
                                        Flytt ned
                                    </Button>
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
                            </div>

                            <ImagePicker
                                questionText={question.text}
                                onQuestionTextChange={(text) => updateQuestion(question.id, { text })}
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
                                            timeLimitSeconds:
                                                e.target.value === 'default' ? null : Number(e.target.value),
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
                    </React.Fragment>
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

            {error && <Alert variant="error">{error}</Alert>}

            <div className="flex flex-wrap gap-2">
                <Button onClick={() => save(true)} loading={isPending}>
                    {quizId ? 'Lagre og lukk' : 'Lagre quiz'}
                </Button>
                {quizId && (
                    <Button variant="secondary" onClick={() => save(false)} loading={isPending}>
                        Lagre endringer
                    </Button>
                )}
                <Button variant="secondary" onClick={() => router.push('/quiz')} disabled={isPending}>
                    Avbryt
                </Button>
            </div>
        </div>
    )
}

export default QuizBuilder
