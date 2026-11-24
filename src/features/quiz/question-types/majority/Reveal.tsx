'use client'

import { BodyShort, Heading } from '@navikt/ds-react'
import React, { ReactElement, useEffect, useState } from 'react'

import { RevealProps } from '#features/quiz/question-types'
import { cn } from '#lib/tw'

/** Starts at 0 and flips to 1 after mount, so the bars grow in like a live poll. */
function useGrowIn(): number {
    const [scale, setScale] = useState(0)
    useEffect(() => {
        const frame = requestAnimationFrame(() => setScale(1))
        return () => cancelAnimationFrame(frame)
    }, [])
    return scale
}

function MajorityReveal({ question, data, results, myResult }: RevealProps<'majority'>): ReactElement {
    const grow = useGrowIn()
    const myOptionId = myResult?.answer?.type === 'majority' ? myResult.answer.optionId : null
    const votes = new Map<string, number>(question.options.map((o) => [o.id, 0]))
    for (const result of results) {
        if (result.answer?.type !== 'majority') continue
        votes.set(result.answer.optionId, (votes.get(result.answer.optionId) ?? 0) + 1)
    }
    const total = [...votes.values()].reduce((a, b) => a + b, 0)
    const top = Math.max(1, ...votes.values())
    const winners = new Set(data.winningOptionIds)
    // Most popular first: the whole point of the reveal is the ranking.
    const ranked = [...question.options].sort((a, b) => (votes.get(b.id) ?? 0) - (votes.get(a.id) ?? 0))

    return (
        <div className="flex flex-col gap-3">
            <Heading level="3" size="small">
                {winners.size === 0
                    ? 'Ingen stemte – flertallet forblir et mysterium.'
                    : winners.size > 1
                      ? 'Delt seier! Flertallet klarte ikke å bestemme seg.'
                      : 'Flertallet har talt 👑'}
            </Heading>
            <ul className="flex flex-col gap-2">
                {ranked.map((option, index) => {
                    const count = votes.get(option.id) ?? 0
                    const isWinner = winners.has(option.id)
                    const iChose = myOptionId === option.id
                    const percent = total > 0 ? Math.round((count / total) * 100) : 0
                    return (
                        <li
                            key={option.id}
                            className={cn(
                                'relative overflow-hidden rounded-md border-2 p-3',
                                isWinner ? 'border-ax-border-success' : 'border-ax-border-neutral-subtle',
                                iChose && !isWinner && 'border-ax-border-accent',
                            )}
                        >
                            <div
                                aria-hidden
                                className={cn(
                                    'absolute inset-y-0 left-0 origin-left transition-transform duration-1000 ease-out',
                                    isWinner ? 'bg-ax-bg-success-moderate' : 'bg-ax-bg-neutral-moderate',
                                )}
                                style={{
                                    width: `${(count / top) * 100}%`,
                                    transform: `scaleX(${grow})`,
                                    transitionDelay: `${(ranked.length - 1 - index) * 120}ms`,
                                }}
                            />
                            <div className="relative flex items-center justify-between gap-2">
                                <span>
                                    {isWinner && '👑 '}
                                    {option.text}
                                    {iChose && <span className="ml-2 text-sm font-semibold">(ditt valg)</span>}
                                </span>
                                <span className="text-sm tabular-nums whitespace-nowrap">
                                    {count} {count === 1 ? 'stemme' : 'stemmer'} · {percent} %
                                </span>
                            </div>
                        </li>
                    )
                })}
            </ul>
            {myResult && myOptionId != null && (
                <BodyShort>
                    {myResult.correct
                        ? 'Du leste flokken perfekt!'
                        : myResult.accuracy > 0
                          ? `Ikke helt i takt med flokken – ${Math.round(myResult.accuracy * 100)} % uttelling.`
                          : 'Du var helt alene om det valget.'}
                </BodyShort>
            )}
        </div>
    )
}

export default MajorityReveal
