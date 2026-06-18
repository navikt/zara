'use client'

import React, { ReactElement, useState, useTransition } from 'react'
import { Alert, Button, TextField } from '@navikt/ds-react'

import { QuizContent } from '@services/quiz/quiz-schema'
import { loadQuizForEdit } from '@features/quiz/quiz-actions'
import QuizBuilder from '@features/quiz/builder/QuizBuilder'

type Props = {
    quizId: string
}

type Loaded = { content: QuizContent; defaultTimeLimit: number }

/**
 * Passphrase gate for editing an encrypted quiz: the owner unlocks with their passphrase, then the
 * builder appears. Quizzes that need no passphrase are loaded on the server, so they never get here.
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
                description="Quizen er kryptert. Skriv inn passordfrasen for å redigere den."
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
