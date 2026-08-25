'use client'

import { Alert, BodyLong, Button, TextField } from '@navikt/ds-react'
import React, { FormEvent, ReactElement, useState, useTransition } from 'react'

import { joinWithAlias } from '#features/quiz/play-actions'

type Props = {
    sessionId: string
    /** The quiz is already underway — joining now means starting from the next question. */
    started: boolean
}

const ADJECTIVES = [
    'Grusom',
    'Glup',
    'Rask',
    'Rolig',
    'Sur',
    'Blid',
    'Vill',
    'Lur',
    'Stolt',
    'Sulten',
    'Frekk',
    'Modig',
]
const NOUNS = ['Elg', 'Laks', 'Reke', 'Nisse', 'Brunost', 'Vaffel', 'Fjord', 'Troll', 'Måke', 'Bever', 'Pinnsvin', 'Ku']

function suggestAlias(): string {
    const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    return `${adjective} ${noun.toLowerCase()}`
}

function JoinForm({ sessionId, started }: Props): ReactElement {
    const [alias, setAlias] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isPending, startTransition] = useTransition()

    const submit = (event: FormEvent): void => {
        event.preventDefault()
        setError(null)
        startTransition(async () => {
            // A successful join redirects, so anything we get back here is a failure.
            const result = await joinWithAlias(sessionId, alias)
            if (result) setError(result.error)
        })
    }

    return (
        <form onSubmit={submit} className="flex flex-col gap-4 bg-ax-bg-raised p-4 rounded-md max-w-xl">
            <BodyLong>
                Navnet ditt vises i lobbyen, så alle ser hvem som er med. Men så snart quizen starter er det bare
                kallenavnet ditt som vises på ledertavla – helt til verten avslører pallen til slutt.
            </BodyLong>

            {started && (
                <Alert variant="info" size="small">
                    Quizen er allerede i gang. Du blir med fra og med neste spørsmål.
                </Alert>
            )}

            <div className="flex items-end gap-2">
                <TextField
                    label="Kallenavn for denne quizen"
                    description="2–20 tegn. Kan ikke endres underveis."
                    value={alias}
                    onChange={(event) => setAlias(event.target.value)}
                    maxLength={20}
                    autoComplete="off"
                    className="grow"
                />
                <Button type="button" variant="secondary" onClick={() => setAlias(suggestAlias())}>
                    Foreslå
                </Button>
            </div>

            {error && <Alert variant="warning">{error}</Alert>}

            <div>
                <Button type="submit" loading={isPending} disabled={alias.trim().length < 2}>
                    Bli med
                </Button>
            </div>
        </form>
    )
}

export default JoinForm
