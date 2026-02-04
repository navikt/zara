import React, { ReactElement } from 'react'

import { cn } from '@lib/tw'

const sladdet = ['[sladdet]', '[borte]', '[fjernet helt]']

export function RedactedWord({
    seed,
    type = 'full',
}: {
    /**
     * The seed dictates the size of the redacted word, there is a limited set of pre-determined sizes.
     */
    seed: number
    type?: 'full' | 'already-redacted'
}): ReactElement {
    return (
        <>
            <span
                className={cn('inline text-base bg-ax-text-neutral', {
                    'pointer-events-none opacity-45': type === 'already-redacted',
                })}
            >
                {sladdet[seed % sladdet.length]}
            </span>{' '}
        </>
    )
}
