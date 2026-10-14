'use client'

import { Button, Textarea } from '@navikt/ds-react'
import React, { ReactElement, useState, useTransition } from 'react'

import { hashIdents } from './hash-idents-actions'

function HashIdentsForm(): ReactElement {
    const [value, setValue] = useState('')
    const [result, setResult] = useState<Awaited<ReturnType<typeof hashIdents>> | null>(null)
    const [isPending, startTransition] = useTransition()

    return (
        <div>
            <form
                className="max-w-prose"
                onSubmit={(event) => {
                    event.preventDefault()
                    setResult(null)
                    startTransition(async () => {
                        try {
                            setResult(await hashIdents(value))
                        } catch {
                            setResult({ error: 'Kunne ikke hashe identene. Prøv igjen.' })
                        }
                    })
                }}
            >
                <Textarea
                    label="Identer"
                    description="Én ident per linje. Tomme linjer, mellomrom før og etter identen og komma på slutten fjernes."
                    value={value}
                    onChange={(event) => {
                        setValue(event.target.value)
                        setResult(null)
                    }}
                    error={result?.error}
                    disabled={isPending}
                    minRows={6}
                />
                <Button type="submit" className="mt-4" loading={isPending}>
                    Hash identer
                </Button>
            </form>
            <div aria-live="polite">
                {result?.results && (
                    <pre className="mt-4 whitespace-pre-wrap break-all">
                        {result.results.map(({ ident, sha }) => `${ident} → ${sha}`).join('\n')}
                    </pre>
                )}
            </div>
        </div>
    )
}

export default HashIdentsForm
