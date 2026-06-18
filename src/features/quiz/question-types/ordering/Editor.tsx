'use client'

import React, { ReactElement } from 'react'
import { BodyShort, Button, TextField } from '@navikt/ds-react'
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '@navikt/aksel-icons'

import { OrderingItem } from '@services/quiz/quiz-schema'
import { EditorProps } from '@features/quiz/question-types'
import { move } from '@features/quiz/question-types/ordering/move'

function OrderingEditor({ draft, onChange }: EditorProps<'ordering'>): ReactElement {
    const { items } = draft

    const updateItem = (id: string, text: string): void =>
        onChange({ items: items.map((it) => (it.id === id ? { ...it, text } : it)) })

    const blankItem = (): OrderingItem => ({ id: crypto.randomUUID(), text: '' })

    return (
        <div className="flex flex-col gap-2">
            <BodyShort size="small" className="text-ax-text-neutral-subtle">
                Legg elementene i riktig rekkefølge (øverst først). Spillerne ser dem stokket.
            </BodyShort>
            {items.map((item, index) => (
                <div key={item.id} className="flex items-center gap-2">
                    <span className="w-6 text-center tabular-nums text-ax-text-neutral-subtle">{index + 1}.</span>
                    <TextField
                        label={`Element ${index + 1}`}
                        hideLabel
                        className="grow"
                        value={item.text}
                        onChange={(e) => updateItem(item.id, e.target.value)}
                    />
                    <Button
                        variant="tertiary"
                        size="small"
                        icon={<ChevronUpIcon aria-hidden />}
                        title="Flytt opp"
                        disabled={index === 0}
                        onClick={() => onChange({ items: move(items, index, index - 1) })}
                    />
                    <Button
                        variant="tertiary"
                        size="small"
                        icon={<ChevronDownIcon aria-hidden />}
                        title="Flytt ned"
                        disabled={index === items.length - 1}
                        onClick={() => onChange({ items: move(items, index, index + 1) })}
                    />
                    <Button
                        variant="tertiary"
                        size="small"
                        icon={<TrashIcon aria-hidden />}
                        title="Fjern"
                        disabled={items.length <= 3}
                        onClick={() => onChange({ items: items.filter((it) => it.id !== item.id) })}
                    />
                </div>
            ))}
            {items.length < 6 && (
                <div>
                    <Button
                        variant="secondary"
                        size="small"
                        icon={<PlusIcon aria-hidden />}
                        onClick={() => onChange({ items: [...items, blankItem()] })}
                    >
                        Legg til element
                    </Button>
                </div>
            )}
        </div>
    )
}

export default OrderingEditor
