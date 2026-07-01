'use client'

import { Alert, BodyShort, Button, Heading, Loader } from '@navikt/ds-react'
import { useRouter } from 'next/navigation'
import React, { ReactElement, useTransition } from 'react'

import PlayerGrid from '#features/quiz/host/PlayerGrid'
import { QUESTION_TYPES } from '#features/quiz/question-types'
import { hostCancelSession, hostEndSession, hostNextQuestion, hostRevealQuestion } from '#features/quiz/session-actions'
import Countdown from '#features/quiz/shared/Countdown'
import Leaderboard from '#features/quiz/shared/Leaderboard'
import QuestionStage from '#features/quiz/shared/QuestionStage'
import { useQuizSession } from '#features/quiz/shared/useQuizSession'
import { PublicQuestion, SessionStatus } from '#services/quiz/quiz-schema'
import { averagePercent } from '#services/quiz/quiz-scoring'

type Props = {
    sessionId: string
    meUserId: string
}

const STATUS_TEXT: Record<SessionStatus, string> = {
    lobby: 'Lobby – venter på start',
    question: 'Spørsmål pågår',
    reveal: 'Fasit vist',
    ended: 'Ferdig',
}

/** Read-only preview of the question while it's live (no answers revealed yet). */
function QuestionPreview({ question }: { question: PublicQuestion }): ReactElement {
    switch (question.type) {
        case 'multiple-choice':
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {question.choices.map((choice) => (
                        <div key={choice.id} className="p-3 rounded-md border-2 border-ax-border-neutral-subtle">
                            {choice.text}
                        </div>
                    ))}
                </div>
            )
        case 'ordering':
            return (
                <BodyShort size="small" className="text-ax-text-neutral-subtle">
                    Spillerne sorterer {question.items.length} elementer i riktig rekkefølge.
                </BodyShort>
            )
        case 'slider':
            return (
                <BodyShort size="small" className="text-ax-text-neutral-subtle">
                    Spillerne gjetter en verdi mellom {question.slider.min} og {question.slider.max}.
                </BodyShort>
            )
        case 'text':
            return (
                <BodyShort size="small" className="text-ax-text-neutral-subtle">
                    Spillerne skriver inn et fritekstsvar.
                </BodyShort>
            )
    }
}

function HostSession({ sessionId, meUserId }: Props): ReactElement {
    const router = useRouter()
    const state = useQuizSession(sessionId)
    const [isPending, startTransition] = useTransition()

    if (!state) {
        return (
            <div className="flex justify-center p-12">
                <Loader size="2xlarge" title="Kobler til sesjonen…" />
            </div>
        )
    }

    const isHost = state.hostUserId === meUserId
    const isLast = state.currentIndex >= state.questionCount - 1
    const answeredCount = state.players.filter((p) => p.answered).length
    const run =
        (fn: () => Promise<void>): (() => void) =>
        () =>
            startTransition(async () => {
                await fn()
            })

    return (
        <div className="flex flex-col gap-6 pb-24">
            <div className="flex flex-wrap justify-between items-center gap-3 bg-ax-bg-raised p-4 rounded-md">
                <div>
                    <Heading level="2" size="medium">
                        {state.quizTitle}
                    </Heading>
                    <BodyShort size="small" className="text-ax-text-neutral-subtle">
                        {STATUS_TEXT[state.status]}
                    </BodyShort>
                </div>
            </div>

            {!isHost && <Alert variant="info">Du ser denne sesjonen som tilskuer (ikke vert).</Alert>}

            {state.status === 'lobby' && (
                <div className="bg-ax-bg-raised p-4 rounded-md">
                    <Heading level="3" size="small" spacing>
                        Spillere ({state.players.length})
                    </Heading>
                    <PlayerGrid players={state.players} showAnswered={false} />
                </div>
            )}

            {(state.status === 'question' || state.status === 'reveal') && state.question && (
                <div className="bg-ax-bg-raised p-4 rounded-md flex flex-col gap-4">
                    <Heading level="3" size="small" className="text-ax-text-neutral-subtle">
                        Spørsmål {state.currentIndex + 1} av {state.questionCount}
                    </Heading>
                    {state.status === 'question' && state.startedAt != null && state.timeLimitSeconds != null && (
                        <Countdown startedAt={state.startedAt} timeLimitSeconds={state.timeLimitSeconds} />
                    )}
                    <QuestionStage question={state.question} />

                    {state.status === 'question' ? (
                        <QuestionPreview question={state.question} />
                    ) : (
                        state.reveal &&
                        (() => {
                            const Reveal = QUESTION_TYPES[state.question.type].Reveal
                            return (
                                <Reveal
                                    question={state.question}
                                    data={state.reveal.data}
                                    results={state.reveal.results}
                                />
                            )
                        })()
                    )}

                    {state.status === 'question' && (
                        <BodyShort size="small" className="text-ax-text-neutral-subtle">
                            {answeredCount} av {state.players.length} har svart
                        </BodyShort>
                    )}
                    <PlayerGrid players={state.players} showAnswered={state.status === 'question'} />
                </div>
            )}

            {state.status === 'reveal' && <Leaderboard entries={state.leaderboard} />}

            {state.status === 'ended' && (
                <div className="flex flex-col gap-4">
                    <Heading level="2" size="large">
                        🏆 Quizen er ferdig!
                    </Heading>
                    <Leaderboard entries={state.leaderboard} totalPercent={averagePercent(state.leaderboard)} />
                    <div>
                        <Button onClick={() => router.push('/quiz')}>Tilbake til quiz-oversikt</Button>
                    </div>
                </div>
            )}

            {isHost && state.status !== 'ended' && (
                <div className="fixed bottom-0 inset-x-0 flex justify-center gap-2 bg-ax-bg-default/90 border-t border-ax-border-neutral-subtle p-3 backdrop-blur">
                    {state.status === 'lobby' && (
                        <>
                            <Button loading={isPending} onClick={run(() => hostNextQuestion(sessionId))}>
                                Start quiz
                            </Button>
                            <Button
                                variant="tertiary"
                                loading={isPending}
                                onClick={() =>
                                    startTransition(async () => {
                                        await hostCancelSession(sessionId)
                                        router.push('/quiz')
                                    })
                                }
                            >
                                Avbryt
                            </Button>
                        </>
                    )}
                    {state.status === 'question' && (
                        <Button loading={isPending} onClick={run(() => hostRevealQuestion(sessionId))}>
                            Vis fasit
                        </Button>
                    )}
                    {state.status === 'reveal' && !isLast && (
                        <Button loading={isPending} onClick={run(() => hostNextQuestion(sessionId))}>
                            Neste spørsmål
                        </Button>
                    )}
                    {state.status === 'reveal' && isLast && (
                        <Button loading={isPending} onClick={run(() => hostEndSession(sessionId))}>
                            Avslutt quiz
                        </Button>
                    )}
                    {(state.status === 'question' || state.status === 'reveal') && (
                        <Button variant="tertiary" loading={isPending} onClick={run(() => hostEndSession(sessionId))}>
                            Avslutt nå
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}

export default HostSession
