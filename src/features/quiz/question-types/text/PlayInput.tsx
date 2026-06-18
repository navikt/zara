'use client'

import React, { FormEvent, ReactElement, useState } from 'react'
import { Button, TextField } from '@navikt/ds-react'

import { PlayInputProps } from '@features/quiz/question-types'

function TextPlayInput({ onAnswer, disabled }: PlayInputProps<'text'>): ReactElement {
    const [text, setText] = useState('')

    const submit = (e: FormEvent): void => {
        e.preventDefault()
        if (text.trim().length === 0) return
        onAnswer({ type: 'text', text })
    }

    return (
        <form className="flex flex-col gap-3" onSubmit={submit}>
            <TextField
                label="Svaret ditt"
                value={text}
                maxLength={500}
                disabled={disabled}
                onChange={(e) => setText(e.target.value)}
            />
            <Button type="submit" disabled={disabled || text.trim().length === 0}>
                Send svar
            </Button>
        </form>
    )
}

export default TextPlayInput
