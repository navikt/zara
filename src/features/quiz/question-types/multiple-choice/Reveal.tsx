'use client'

import React, { ReactElement } from 'react'

import { cn } from '@lib/tw'
import { RevealProps } from '@features/quiz/question-types'

function MultipleChoiceReveal({ question, data, results, myResult }: RevealProps<'multiple-choice'>): ReactElement {
    const myChoiceId = myResult?.answer?.type === 'multiple-choice' ? myResult.answer.choiceId : null

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {question.choices.map((choice) => {
                const isCorrect = data.correctChoiceId === choice.id
                const iChose = myChoiceId === choice.id
                const count = results.filter(
                    (r) => r.answer?.type === 'multiple-choice' && r.answer.choiceId === choice.id,
                ).length
                return (
                    <div
                        key={choice.id}
                        className={cn(
                            'p-3 rounded-md border-2 flex justify-between items-center gap-2',
                            isCorrect
                                ? 'border-ax-border-success bg-ax-bg-success-moderate'
                                : iChose
                                  ? 'border-ax-border-danger bg-ax-bg-danger-moderate'
                                  : 'border-ax-border-neutral-subtle',
                        )}
                    >
                        <span>{choice.text}</span>
                        <span className="text-sm tabular-nums whitespace-nowrap">
                            {count} svar
                            {isCorrect ? ' ✓' : iChose ? ' ✗' : ''}
                        </span>
                    </div>
                )
            })}
        </div>
    )
}

export default MultipleChoiceReveal
