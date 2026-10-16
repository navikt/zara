'use client'

import { ChevronDownIcon, ChevronUpIcon, DragVerticalIcon } from '@navikt/aksel-icons'
import { BodyShort, Button } from '@navikt/ds-react'
import { Reorder, useDragControls, useReducedMotion } from 'motion/react'
import React, { ReactElement, useEffect, useEffectEvent, useRef, useState } from 'react'

import { PlayInputProps } from '#features/quiz/question-types'
import { move } from '#features/quiz/question-types/ordering/move'
import { PublicOrderingItem } from '#services/quiz/quiz-schema'

function OrderingRow({
    item,
    index,
    count,
    disabled,
    onMove,
}: {
    item: PublicOrderingItem
    index: number
    count: number
    disabled: boolean
    onMove: (direction: -1 | 1) => void
}): ReactElement {
    const controls = useDragControls()
    const reduceMotion = useReducedMotion()

    return (
        <Reorder.Item
            value={item}
            dragListener={false}
            dragControls={controls}
            drag={disabled ? false : 'y'}
            transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 450, damping: 30 }}
            whileDrag={{ boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)' }}
            className="relative flex items-center gap-2 p-3 rounded-md border-2 border-ax-border-neutral-subtle bg-ax-bg-raised"
        >
            <Button
                type="button"
                variant="tertiary"
                size="small"
                icon={<DragVerticalIcon aria-hidden />}
                aria-label={`Dra for å flytte ${item.text}`}
                title="Dra for å flytte. Bruk pilknappene med tastatur."
                className="touch-none cursor-grab active:cursor-grabbing shrink-0"
                disabled={disabled}
                onPointerDown={(event) => {
                    if (!disabled) controls.start(event)
                }}
            />
            <span className="w-6 shrink-0 text-center tabular-nums text-ax-text-neutral-subtle">{index + 1}.</span>
            <span className="grow min-w-0 break-words">{item.text}</span>
            <Button
                variant="tertiary"
                size="small"
                icon={<ChevronUpIcon aria-hidden />}
                title="Flytt opp"
                aria-label={`Flytt ${item.text} opp`}
                disabled={disabled || index === 0}
                onClick={() => onMove(-1)}
            />
            <Button
                variant="tertiary"
                size="small"
                icon={<ChevronDownIcon aria-hidden />}
                title="Flytt ned"
                aria-label={`Flytt ${item.text} ned`}
                disabled={disabled || index === count - 1}
                onClick={() => onMove(1)}
            />
        </Reorder.Item>
    )
}

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
            <BodyShort size="small" className="text-ax-text-neutral-subtle">
                Dra i håndtakene eller bruk pilene for å sortere svarene.
            </BodyShort>
            <Reorder.Group
                axis="y"
                values={items}
                onReorder={(next) => {
                    if (!disabled && !submitted.current) setItems(next)
                }}
                className="flex flex-col gap-2 list-none p-0 m-0"
            >
                {items.map((item, index) => (
                    <OrderingRow
                        key={item.id}
                        item={item}
                        index={index}
                        count={items.length}
                        disabled={disabled}
                        onMove={(direction) => setItems((previous) => move(previous, index, index + direction))}
                    />
                ))}
            </Reorder.Group>
            <Button onClick={submit} disabled={disabled}>
                Lås rekkefølgen
            </Button>
        </div>
    )
}

export default OrderingPlayInput
