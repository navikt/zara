'use client'

import { Alert, BodyShort, Button, Heading, Loader, Tag } from '@navikt/ds-react'
import { useRouter } from 'next/navigation'
import React, { ReactElement, useState, useTransition } from 'react'

import { answerQuestion } from '#features/quiz/play-actions'
import { QUESTION_TYPES } from '#features/quiz/question-types'
import ConnectionAlert from '#features/quiz/shared/ConnectionAlert'
import Countdown from '#features/quiz/shared/Countdown'
import Leaderboard from '#features/quiz/shared/Leaderboard'
import LobbyRoster from '#features/quiz/shared/LobbyRoster'
import Podium from '#features/quiz/shared/Podium'
import QuestionStage from '#features/quiz/shared/QuestionStage'
import { useQuizSession } from '#features/quiz/shared/useQuizSession'
import { AnswerPayload } from '#services/quiz/quiz-schema'
import { averagePercent } from '#services/quiz/quiz-scoring'

type Props = {
    sessionId: string
    /** This player's opaque per-session id, used to find themselves in the anonymous lists. */
    myPlayerId: string
    /** Their own alias, passed from the server so it never rides along with a real name. */
    myAlias: string
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

function PlaySession({ sessionId, myPlayerId, myAlias }: Props): ReactElement {
    const router = useRouter()
    const { state, connection, failedAttempts } = useQuizSession(sessionId)
    const [isSubmitting, startTransition] = useTransition()
    const [answeredIndex, setAnsweredIndex] = useState<number | null>(null)
    const [answerError, setAnswerError] = useState<{ index: number; text: string } | null>(null)

    if (!state) {
        return (
            <div className="flex flex-col items-center gap-4 p-12">
                {connection === 'offline' ? (
                    <ConnectionAlert connection={connection} failedAttempts={failedAttempts} />
                ) : (
                    <Loader size="2xlarge" title="Kobler til sesjonen…" />
                )}
            </div>
        )
    }

    const serverAnswered = state.players.find((p) => p.playerId === myPlayerId)?.answered ?? false
    const iHaveAnswered = serverAnswered || answeredIndex === state.currentIndex
    const myResult = state.reveal?.results.find((r) => r.playerId === myPlayerId)
    const currentError = answerError?.index === state.currentIndex ? answerError.text : null

    const answer = (payload: AnswerPayload): void => {
        const index = state.currentIndex
        setAnsweredIndex(index)
        setAnswerError(null)
        startTransition(async () => {
            const failed = (text: string): void => {
                setAnswerError({ index, text })
                // Roll the optimistic flag back so they can actually try again.
                setAnsweredIndex((current) => (current === index ? null : current))
            }
            try {
                const result = await answerQuestion(sessionId, payload)
                if (!result.ok) failed(reasonText(result.reason))
            } catch {
                // The action never reached the server. Without this the optimistic "Du svarte!"
                // sticks and the player sits out the question believing they answered.
                failed('Fikk ikke sendt svaret – sjekk nettforbindelsen og prøv igjen.')
            }
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <ConnectionAlert connection={connection} failedAttempts={failedAttempts} />

            <div className="flex flex-wrap justify-between items-center gap-3 bg-ax-bg-raised p-4 rounded-md">
                <Heading level="2" size="medium">
                    {state.quizTitle}
                </Heading>
                <Tag variant="alt1" size="small">
                    Du spiller som «{myAlias}»
                </Tag>
            </div>

            {state.status === 'lobby' && (
                <div className="bg-ax-bg-raised p-4 rounded-md flex flex-col gap-3">
                    <Heading level="3" size="small">
                        Du er med! Venter på at verten starter…
                    </Heading>
                    <BodyShort size="small" className="text-ax-text-neutral-subtle">
                        Når quizen starter ser alle bare kallenavnet ditt.
                    </BodyShort>
                    <LobbyRoster players={state.lobbyRoster} />
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
                    <Leaderboard entries={state.leaderboard} myPlayerId={myPlayerId} />
                </div>
            )}

            {state.status === 'ended' && (
                <div className="flex flex-col gap-6">
                    <Heading level="2" size="large">
                        🏆 Quizen er ferdig!
                    </Heading>
                    {(() => {
                        const myEntry = state.leaderboard.find((e) => e.playerId === myPlayerId)
                        return myEntry ? (
                            <Alert variant="info">
                                Du havnet på {myEntry.rank}. plass med {myEntry.points} poeng ({myEntry.percent}%
                                riktig).
                            </Alert>
                        ) : null
                    })()}
                    <Podium entries={state.leaderboard} myPlayerId={myPlayerId} />
                    {state.leaderboard.length > 3 && (
                        <Leaderboard
                            entries={state.leaderboard}
                            myPlayerId={myPlayerId}
                            startRank={4}
                            heading="Resten av feltet"
                        />
                    )}
                    <div className="flex items-center justify-between gap-3 px-3 pt-2 border-t border-ax-border-neutral-subtle">
                        <span className="font-semibold">Lagets totalscore</span>
                        <span className="font-bold tabular-nums">{averagePercent(state.leaderboard)}% riktig</span>
                    </div>
                    {state.revealStep < state.revealMaxStep && <Alert variant="info">Verten avslører navnene …</Alert>}
                    <div>
                        <Button variant="secondary" onClick={() => router.push('/quiz')}>
                            Tilbake til quiz-oversikt
                        </Button>
                    </div>
                </div>
            )}

            {state.status !== 'lobby' && (
                <Tag variant="neutral" size="xsmall" className="w-fit">
                    {state.players.length} spillere tilkoblet
                </Tag>
            )}
        </div>
    )
}

export default PlaySession
