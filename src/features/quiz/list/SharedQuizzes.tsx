'use client'

import { BarChartIcon, FilesIcon, PlayIcon } from '@navikt/aksel-icons'
import { Alert, BodyShort, Button, Heading, Tag } from '@navikt/ds-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { ReactElement, useState, useTransition } from 'react'

import { hostStartSession } from '#features/quiz/session-actions'
import { QuizSummary } from '#services/quiz/quiz-schema'

type Props = {
    quizzes: QuizSummary[]
}

/**
 * The team's shared library: quizzes someone else has played through to the end. They're immutable,
 * so you can only host them again or duplicate them into your own draft. Shared quizzes are always
 * app-secret encrypted, so hosting never asks for a passphrase.
 */
function SharedQuizzes({ quizzes }: Props): ReactElement {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [error, setError] = useState<string | null>(null)

    const host = (quizId: string): void => {
        setError(null)
        startTransition(async () => {
            const result = await hostStartSession(quizId, null)
            if ('error' in result) {
                setError(result.error)
                return
            }
            router.push(`/quiz/host/${result.sessionId}`)
        })
    }

    if (quizzes.length === 0) {
        return (
            <BodyShort className="text-ax-text-neutral-subtle italic">
                Ingen delte quizer ennå. De dukker opp her når noen har spilt ferdig en quiz.
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
                            <Tag variant="success" size="xsmall">
                                Delt
                            </Tag>
                        </Heading>
                        <BodyShort size="small" className="text-ax-text-neutral-subtle">
                            {quiz.questionCount} spørsmål · {quiz.defaultTimeLimit}s standardtid · laget av{' '}
                            {quiz.ownerUserId}
                        </BodyShort>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="small"
                            icon={<PlayIcon aria-hidden />}
                            loading={isPending}
                            onClick={() => host(quiz.id)}
                        >
                            Start quiz
                        </Button>
                        <Button
                            as={Link}
                            href={`/quiz/new?from=${quiz.id}`}
                            size="small"
                            variant="secondary"
                            icon={<FilesIcon aria-hidden />}
                        >
                            Dupliser
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
                    </div>
                </div>
            ))}
        </div>
    )
}

export default SharedQuizzes
