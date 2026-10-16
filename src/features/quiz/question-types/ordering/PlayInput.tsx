'use client'

import { ChevronDownIcon, ChevronUpIcon } from '@navikt/aksel-icons'
import { BodyShort, Button } from '@navikt/ds-react'
import React, { ReactElement, useEffect, useEffectEvent, useRef, useState } from 'react'

import { PlayInputProps } from '#features/quiz/question-types'
import { move } from '#features/quiz/question-types/ordering/move'
import { PublicOrderingItem } from '#services/quiz/quiz-schema'

function OrderingPlayInput({ question, onAnswer, disabled, deadline }: PlayInputProps<'ordering'>): ReactElement {
    const [items, setItems] = useState<PublicOrderingItem[]>(question.items)
    const submitted = useRef(false)

    const submit = (): void => {
        if (disabled || submitted.current) return
        submitted.current = true
        onAnswer({ type: 'ordering', order: items.map((it) => it.id) })
    }

    const submitAtDeadline = useEffectEvent(submit)

    useEffect(() => {
        if (deadline == null || disabled) return
        const timer = window.setTimeout(() => submitAtDeadline(), Math.max(0, deadline - Date.now()))
        return () => window.clearTimeout(timer)
    }, [deadline, disabled])

    return (
        <div className="flex flex-col gap-3">
            {deadline != null && (
                <BodyShort size="small" className="text-ax-text-neutral-subtle">
                    Rekkefølgen sendes automatisk når tiden er ute. Du kan låse svaret tidligere når du er klar.
                </BodyShort>
            )}
            <div className="flex flex-col gap-2">
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-2 p-3 rounded-md border-2 border-ax-border-neutral-subtle bg-ax-bg-raised"
                    >
                        <span className="w-6 text-center tabular-nums text-ax-text-neutral-subtle">{index + 1}.</span>
                        <span className="grow">{item.text}</span>
                        <Button
                            variant="tertiary"
                            size="small"
                            icon={<ChevronUpIcon aria-hidden />}
                            title="Flytt opp"
                            disabled={disabled || index === 0}
                            onClick={() => setItems((prev) => move(prev, index, index - 1))}
                        />
                        <Button
                            variant="tertiary"
                            size="small"
                            icon={<ChevronDownIcon aria-hidden />}
                            title="Flytt ned"
                            disabled={disabled || index === items.length - 1}
                            onClick={() => setItems((prev) => move(prev, index, index + 1))}
                        />
                    </div>
                ))}
            </div>
            <Button onClick={submit} disabled={disabled}>
                Lås rekkefølgen
            </Button>
        </div>
    )
}

export default OrderingPlayInput
