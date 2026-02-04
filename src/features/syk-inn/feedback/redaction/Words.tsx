import React, { ReactElement } from 'react'

import { cn } from '@lib/tw'

export function RedactedWord({ type = 'full' }: { type?: 'full' | 'already-redacted' }): ReactElement {
    return (
        <>
            <span
                className={cn('bg-ax-text-neutral', {
                    'pointer-events-none opacity-45': type === 'already-redacted',
                })}
            >
                [sladdet]
            </span>{' '}
        </>
    )
}
