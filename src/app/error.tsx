'use client'

import { logger } from '@navikt/next-logger'
import { useEffect } from 'react'

function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        // Log the error to an error reporting service
        logger.error(error)
    }, [error])

    return (
        <div>
            <h2>Something went wrong!</h2>
            <button type="button" onClick={() => reset()}>
                Try again
            </button>
        </div>
    )
}

export default ErrorPage
