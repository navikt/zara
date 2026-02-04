import React, { ReactElement } from 'react'
import { BodyShort } from '@navikt/ds-react'

export function MultilineUserFeedback({ message }: { message: string }): ReactElement {
    const lines = message.split('\n')

    return (
        <>
            {lines.map((line, index) => (
                <BodyShort key={index} spacing={index < lines.length - 1}>
                    {line}
                </BodyShort>
            ))}
        </>
    )
}
