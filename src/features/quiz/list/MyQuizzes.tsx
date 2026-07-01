'use client'

import { BarChartIcon, PencilIcon, PlayIcon, TrashIcon } from '@navikt/aksel-icons'
import { Alert, BodyShort, Button, Heading, Tag, TextField } from '@navikt/ds-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { ReactElement, useState, useTransition } from 'react'

import { removeQuiz } from '#features/quiz/quiz-actions'
import { hostStartSession } from '#features/quiz/session-actions'
import { QuizSummary } from '#services/quiz/quiz-schema'

type Props = {
    quizzes: QuizSummary[]
}

function MyQuizzes({ quizzes }: Props): ReactElement {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
    const [hostId, setHostId] = useState<string | null>(null)
    const [hostPass, setHostPass] = useState('')

    const startHost = (quizId: string, passphrase: string | null): void => {
        setError(null)
        startTransition(async () => {
            const result = await hostStartSession(quizId, passphrase)
            if ('error' in result) {
                setError(result.error)
                return
            }
            router.push(`/quiz/host/${result.sessionId}`)
        })
    }

    const host = (quiz: QuizSummary): void => {
        setError(null)
        if (quiz.needsPassphrase) {
            setHostPass('')
            setHostId(quiz.id)
        } else {
            startHost(quiz.id, null)
        }
    }

    const remove = (quizId: string): void => {
        startTransition(async () => {
            await removeQuiz(quizId)
            setConfirmDeleteId(null)
        })
    }

    if (quizzes.length === 0) {
        return (
            <BodyShort className="text-ax-text-neutral-subtle italic">
                Du har ingen quizer ennå. Lag din første!
            </BodyShort>
        )
    }

    return (
        <div className="flex flex-col gap-3">
            {error && <Alert variant="error">{error}</Alert>}
            {quizzes.map((quiz) => (
                <div
                    key={quiz.id}
                    className="flex flex-wrap items-center justify-between gap-3 bg-ax-bg-raised p-4 rounded-md"
                >
                    <div>
                        <Heading level="3" size="small" className="flex items-center gap-2">
                            {quiz.title}
                            {!quiz.isEncrypted && (
                                <Tag variant="neutral" size="xsmall">
                                    Spilt
                                </Tag>
                            )}
                        </Heading>
                        <BodyShort size="small" className="text-ax-text-neutral-subtle">
                            {quiz.questionCount} spørsmål · {quiz.defaultTimeLimit}s standardtid
                        </BodyShort>
                    </div>
                    <div className="flex gap-2">
                        {hostId === quiz.id ? (
                            <>
                                <TextField
                                    label="Passordfrase"
                                    hideLabel
                                    type="password"
                                    size="small"
                                    placeholder="Passordfrase"
                                    value={hostPass}
                                    onChange={(e) => setHostPass(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') startHost(quiz.id, hostPass)
                                    }}
                                />
                                <Button size="small" loading={isPending} onClick={() => startHost(quiz.id, hostPass)}>
                                    Start
                                </Button>
                                <Button size="small" variant="tertiary" onClick={() => setHostId(null)}>
                                    Avbryt
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="small"
                                icon={<PlayIcon aria-hidden />}
                                loading={isPending}
                                onClick={() => host(quiz)}
                            >
                                Start quiz
                            </Button>
                        )}
                        <Button
                            as={Link}
                            href={`/quiz/${quiz.id}/edit`}
                            size="small"
                            variant="secondary"
                            icon={<PencilIcon aria-hidden />}
                        >
                            Rediger
                        </Button>
                        <Button
                            as={Link}
                            href={`/quiz/${quiz.id}/results`}
                            size="small"
                            variant="secondary"
                            icon={<BarChartIcon aria-hidden />}
                        >
                            Resultater
                        </Button>
                        {confirmDeleteId === quiz.id ? (
                            <>
                                <Button
                                    size="small"
                                    variant="danger"
                                    loading={isPending}
                                    onClick={() => remove(quiz.id)}
                                >
                                    Bekreft sletting
                                </Button>
                                <Button size="small" variant="tertiary" onClick={() => setConfirmDeleteId(null)}>
                                    Avbryt
                                </Button>
                            </>
                        ) : (
                            <Button
                                size="small"
                                variant="tertiary"
                                icon={<TrashIcon aria-hidden />}
                                onClick={() => setConfirmDeleteId(quiz.id)}
                            >
                                Slett
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}

export default MyQuizzes
