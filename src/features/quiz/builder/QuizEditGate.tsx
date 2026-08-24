'use client'

import { Alert, Button, TextField } from '@navikt/ds-react'
import React, { ReactElement, useState, useTransition } from 'react'

import QuizBuilder from '#features/quiz/builder/QuizBuilder'
import { loadQuizForEdit } from '#features/quiz/quiz-actions'
import { QuizContent } from '#services/quiz/quiz-schema'

type Props = {
    quizId: string
}

type Loaded = { content: QuizContent; defaultTimeLimit: number }

/**
 * Unlock gate for LEGACY quizzes still encrypted with the owner's passphrase. Once unlocked and
 * saved, the quiz is re-encrypted with the app secret and never asks for a passphrase again. New
 * quizzes need no passphrase at all, so they're loaded on the server and never get here.
 */
function QuizEditGate({ quizId }: Props): ReactElement {
    const [loaded, setLoaded] = useState<Loaded | null>(null)
    const [passphrase, setPassphrase] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const load = (): void => {
        setError(null)
        startTransition(async () => {
            const result = await loadQuizForEdit(quizId, passphrase)
            if (result.ok) {
                setLoaded({ content: result.content, defaultTimeLimit: result.defaultTimeLimit })
            } else {
                setError(result.reason === 'wrong-passphrase' ? 'Feil passordfrase.' : 'Fant ikke quizen.')
            }
        })
    }

    if (loaded) {
        return (
            <QuizBuilder
                existing={{ id: quizId, content: loaded.content, defaultTimeLimit: loaded.defaultTimeLimit }}
            />
        )
    }

    return (
        <div className="flex flex-col gap-4 max-w-sm bg-ax-bg-raised p-4 rounded-md">
            <TextField
                label="Passordfrase"
                type="password"
                description="Denne quizen ble laget med en passordfrase. Skriv den inn for å låse opp — neste gang du lagrer blir den fjernet."
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') load()
                }}
            />
            {error && <Alert variant="error">{error}</Alert>}
            <div>
                <Button loading={isPending} onClick={() => load()}>
                    Lås opp
                </Button>
            </div>
        </div>
    )
}

export default QuizEditGate
