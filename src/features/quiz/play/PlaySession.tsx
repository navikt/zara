'use client'

import { Alert, Button, Heading, Loader, Tag } from '@navikt/ds-react'
import { useRouter } from 'next/navigation'
import React, { ReactElement, useState, useTransition } from 'react'

import PlayerGrid from '#features/quiz/host/PlayerGrid'
import { answerQuestion } from '#features/quiz/play-actions'
import { QUESTION_TYPES } from '#features/quiz/question-types'
import Countdown from '#features/quiz/shared/Countdown'
import Leaderboard from '#features/quiz/shared/Leaderboard'
import QuestionStage from '#features/quiz/shared/QuestionStage'
import { useQuizSession } from '#features/quiz/shared/useQuizSession'
import { AnswerPayload } from '#services/quiz/quiz-schema'
import { averagePercent } from '#services/quiz/quiz-scoring'

type Props = {
    sessionId: string
    meUserId: string
}

function reasonText(reason: string): string {
    switch (reason) {
        case 'locked':
            return 'Tiden er ute – du rakk det ikke.'
        case 'already-answered':
            return 'Du har allerede svart.'
        case 'not-accepting':
            return 'Spørsmålet tar ikke imot svar akkurat nå.'
        case 'invalid-answer':
            return 'Svaret var ikke gyldig.'
        default:
            return 'Kunne ikke registrere svaret.'
    }
}

function PlaySession({ sessionId, meUserId }: Props): ReactElement {
    const router = useRouter()
    const state = useQuizSession(sessionId)
    const [isSubmitting, startTransition] = useTransition()
    const [answeredIndex, setAnsweredIndex] = useState<number | null>(null)
    const [answerError, setAnswerError] = useState<{ index: number; text: string } | null>(null)

    const myId = meUserId

    if (!state) {
        return (
            <div className="flex justify-center p-12">
                <Loader size="2xlarge" title="Kobler til sesjonen…" />
            </div>
        )
    }

    const serverAnswered = state.players.find((p) => p.userId === myId)?.answered ?? false
    const iHaveAnswered = serverAnswered || answeredIndex === state.currentIndex
    const myResult = state.reveal?.results.find((r) => r.userId === myId)
    const currentError = answerError?.index === state.currentIndex ? answerError.text : null

    const answer = (payload: AnswerPayload): void => {
        const index = state.currentIndex
        setAnsweredIndex(index)
        setAnswerError(null)
        startTransition(async () => {
            const result = await answerQuestion(sessionId, payload)
            if (!result.ok) {
                setAnswerError({ index, text: reasonText(result.reason) })
                setAnsweredIndex((current) => (current === index ? null : current))
            }
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap justify-between items-center gap-3 bg-ax-bg-raised p-4 rounded-md">
                <Heading level="2" size="medium">
                    {state.quizTitle}
                </Heading>
            </div>

            {state.status === 'lobby' && (
                <div className="bg-ax-bg-raised p-4 rounded-md flex flex-col gap-3">
                    <Heading level="3" size="small">
                        Du er med! Venter på at verten starter…
                    </Heading>
                    <PlayerGrid players={state.players} showAnswered={false} />
                </div>
            )}

            {state.status === 'question' && state.question && (
                <div className="flex flex-col gap-4">
                    {state.startedAt != null && state.timeLimitSeconds != null && (
                        <Countdown startedAt={state.startedAt} timeLimitSeconds={state.timeLimitSeconds} />
                    )}
                    <QuestionStage question={state.question} />

                    {iHaveAnswered ? (
                        <Alert variant="success">Du svarte! Venter på de andre spillerne…</Alert>
                    ) : (
                        (() => {
                            const PlayInput = QUESTION_TYPES[state.question.type].PlayInput
                            return <PlayInput question={state.question} onAnswer={answer} disabled={isSubmitting} />
                        })()
                    )}

                    {currentError && <Alert variant="warning">{currentError}</Alert>}
                </div>
            )}

            {state.status === 'reveal' && state.question && state.reveal && (
                <div className="flex flex-col gap-4">
                    {myResult?.correct ? (
                        <Alert variant="success">Riktig! Du fikk {myResult.points} poeng.</Alert>
                    ) : myResult && myResult.points > 0 ? (
                        <Alert variant="info">Nesten! Du fikk {myResult.points} poeng.</Alert>
                    ) : (
                        <Alert variant="error">{myResult ? 'Feil svar denne gangen.' : 'Du svarte ikke i tide.'}</Alert>
                    )}
                    {(() => {
                        const Reveal = QUESTION_TYPES[state.question.type].Reveal
                        return (
                            <Reveal
                                question={state.question}
                                data={state.reveal.data}
                                results={state.reveal.results}
                                myResult={myResult}
                            />
                        )
                    })()}
                    <Leaderboard entries={state.leaderboard} meUserId={myId} />
                </div>
            )}

            {state.status === 'ended' && (
                <div className="flex flex-col gap-4">
                    <Heading level="2" size="large">
                        🏆 Quizen er ferdig!
                    </Heading>
                    {(() => {
                        const myEntry = state.leaderboard.find((e) => e.userId === myId)
                        return myEntry ? (
                            <Alert variant="info">
                                Du havnet på {myEntry.rank}. plass med {myEntry.points} poeng ({myEntry.percent}%
                                riktig).
                            </Alert>
                        ) : null
                    })()}
                    <Leaderboard
                        entries={state.leaderboard}
                        meUserId={myId}
                        totalPercent={averagePercent(state.leaderboard)}
                    />
                    <div>
                        <Button variant="secondary" onClick={() => router.push('/quiz')}>
                            Tilbake til quiz-oversikt
                        </Button>
                    </div>
                </div>
            )}

            <Tag variant="neutral" size="xsmall" className="w-fit">
                {state.players.length} spillere tilkoblet
            </Tag>
        </div>
    )
}

export default PlaySession
