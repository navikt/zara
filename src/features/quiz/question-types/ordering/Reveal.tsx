'use client'

import React, { ReactElement } from 'react'

import { cn } from '@lib/tw'
import { RevealProps } from '@features/quiz/question-types'

function OrderingReveal({ question, data, myResult }: RevealProps<'ordering'>): ReactElement {
    const textById = new Map(question.items.map((it) => [it.id, it.text] as const))
    const myOrder = myResult?.answer?.type === 'ordering' ? myResult.answer.order : null

    return (
        <div className="flex flex-col gap-2">
            {data.correctOrder.map((id, index) => {
                const iGotItHere = myOrder?.[index] === id
                return (
                    <div
                        key={id}
                        className={cn(
                            'p-3 rounded-md border-2 flex items-center gap-3',
                            myOrder
                                ? iGotItHere
                                    ? 'border-ax-border-success bg-ax-bg-success-moderate'
                                    : 'border-ax-border-danger bg-ax-bg-danger-moderate'
                                : 'border-ax-border-neutral-subtle',
                        )}
                    >
                        <span className="w-6 text-center tabular-nums font-bold">{index + 1}.</span>
                        <span className="grow">{textById.get(id) ?? id}</span>
                        {myOrder && <span>{iGotItHere ? '✓' : '✗'}</span>}
                    </div>
                )
            })}
        </div>
    )
}

export default OrderingReveal
