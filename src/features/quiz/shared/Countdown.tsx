'use client'

import React, { ReactElement, useState } from 'react'

import useInterval from '@lib/hooks/useInterval'

type Props = {
    startedAt: number
    timeLimitSeconds: number
}

/** A shrinking time bar driven by the server's question start timestamp. */
function Countdown({ startedAt, timeLimitSeconds }: Props): ReactElement {
    const totalMs = timeLimitSeconds * 1000
    const [now, setNow] = useState(() => Date.now())

    useInterval(() => setNow(Date.now()), 200)

    const remaining = Math.max(0, startedAt + totalMs - now)
    const ratio = totalMs > 0 ? remaining / totalMs : 0
    const seconds = Math.ceil(remaining / 1000)

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span>Tid igjen</span>
                <span className="tabular-nums font-bold">{seconds}s</span>
            </div>
            <div className="h-3 w-full bg-ax-bg-neutral-moderate rounded-full overflow-hidden">
                <div
                    className="h-full bg-ax-bg-accent-strong transition-[width] duration-200 ease-linear"
                    style={{ width: `${ratio * 100}%` }}
                />
            </div>
        </div>
    )
}

export default Countdown
