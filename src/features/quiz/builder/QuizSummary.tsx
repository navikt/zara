'use client'

import { Heading } from '@navikt/ds-react'
import React, { ReactElement, useEffect, useRef, useState } from 'react'

import { DraftQuestion, QUESTION_TYPES, QUESTION_TYPE_ORDER } from '#features/quiz/question-types'
import { cn } from '#lib/tw'

function QuizSummary({ questions }: { questions: DraftQuestion[] }): ReactElement {
    const summaryRef = useRef<HTMLElement>(null)
    const [floating, setFloating] = useState(false)

    useEffect(() => {
        const editor = summaryRef.current?.parentElement
        if (!editor) return

        const updatePosition = (): void => {
            // Reserve a 16rem card and a 1rem gap on both sides without covering the editor.
            const cardWidth = 16 * Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
            setFloating(
                window.innerWidth - editor.getBoundingClientRect().right >= cardWidth + 32 && window.innerHeight >= 400,
            )
        }

        updatePosition()
        const observer = new ResizeObserver(updatePosition)
        observer.observe(editor)
        window.addEventListener('resize', updatePosition)
        return () => {
            observer.disconnect()
            window.removeEventListener('resize', updatePosition)
        }
    }, [])

    return (
        <aside
            ref={summaryRef}
            aria-label="Quizoppsummering"
            className={cn(
                'rounded-md border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 text-sm',
                floating && 'fixed bottom-4 right-4 z-20 w-64 shadow-md',
            )}
        >
            <Heading level="3" size="xsmall" spacing>
                Quizoppsummering
            </Heading>
            <dl className="flex flex-col gap-2">
                <div className="flex justify-between gap-4 font-semibold">
                    <dt>Antall spørsmål</dt>
                    <dd className="tabular-nums">{questions.length}</dd>
                </div>
                {QUESTION_TYPE_ORDER.map((type) => (
                    <div key={type} className="flex justify-between gap-4">
                        <dt>{QUESTION_TYPES[type].label}</dt>
                        <dd className="tabular-nums">
                            {questions.filter((question) => question.type === type).length}
                        </dd>
                    </div>
                ))}
                <div className="flex justify-between gap-4 border-t border-ax-border-neutral-subtle pt-2">
                    <dt>Spørsmål med bilde</dt>
                    <dd className="tabular-nums">{questions.filter((question) => question.imageId != null).length}</dd>
                </div>
            </dl>
        </aside>
    )
}

export default QuizSummary
