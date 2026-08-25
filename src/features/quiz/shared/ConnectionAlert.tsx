'use client'

import { Alert, BodyShort, Button } from '@navikt/ds-react'
import React, { ReactElement } from 'react'

import { ConnectionStatus } from '#features/quiz/shared/useQuizSession'

type Props = {
    connection: ConnectionStatus
    failedAttempts: number
}

/** After this many failed attempts, retrying is clearly not going to fix it on its own. */
const RELOAD_HINT_AFTER = 3

/**
 * Tells the player the live stream is down. Worth being loud about: the countdown is computed from
 * the local clock, so a disconnected screen keeps ticking convincingly and otherwise looks fine.
 */
function ConnectionAlert({ connection, failedAttempts }: Props): ReactElement | null {
    if (connection !== 'offline') return null

    // A dead token can't recover on its own — only a full page load re-runs the login redirect.
    if (failedAttempts >= RELOAD_HINT_AFTER) {
        return (
            <Alert variant="error">
                <BodyShort spacing>
                    Får ikke kontakt med quizen. Innloggingen kan ha gått ut – last inn siden på nytt.
                </BodyShort>
                <Button size="small" onClick={() => window.location.reload()}>
                    Last inn på nytt
                </Button>
            </Alert>
        )
    }

    return (
        <Alert variant="warning" size="small">
            Mistet forbindelsen til quizen. Prøver å koble til igjen … Poengene dine er trygge.
        </Alert>
    )
}

export default ConnectionAlert
