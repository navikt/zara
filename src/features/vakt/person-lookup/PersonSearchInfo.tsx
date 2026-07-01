import { Heading, LocalAlert } from '@navikt/ds-react'
import { LocalAlertContent, LocalAlertHeader, LocalAlertTitle } from '@navikt/ds-react/LocalAlert'
import { logger } from '@navikt/next-logger'
import React, { ReactElement, ReactNode } from 'react'
import * as R from 'remeda'

import { validateUserSession } from '#services/auth/auth'
import { pdlApiService } from '#services/pdl/pdl-api-service'

type Props = {
    ident: string
}

async function PersonSearchInfo({ ident }: Props): Promise<ReactElement> {
    await validateUserSession('TEAM_MEMBER')

    const pdlPerson = await pdlApiService.getPdlPerson(ident)
    if ('errorType' in pdlPerson) {
        logger.error(`Unable to find person, cause: ${pdlPerson.errorType}`)

        return (
            <PersonError title="Henting av person feilet" description={`Teknisk feilmelding: ${pdlPerson.errorType}`} />
        )
    }

    const pdl = await pdlApiService.getPdlPerson(ident)
    if ('errorType' in pdl) {
        logger.error(`Error fetching from PDL, cause: ${pdl.errorType}`)

        return (
            <LocalAlert status="warning" className="max-w-prose mt-8">
                <LocalAlertHeader>
                    <LocalAlertTitle>Fant ikke info om person</LocalAlertTitle>
                </LocalAlertHeader>
            </LocalAlert>
        )
    }

    await new Promise((resolve) => setTimeout(resolve, 2500))

    return (
        <>
            <Heading size="small" level="4" className="mt-4">
                Info om bruker i PDL (tsm-pdl-cache)
            </Heading>
            <div className="max-w-prose border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md rounded-r-none grow">
                {R.pipe(
                    pdl,
                    R.entries(),
                    R.map(([key, data]) => (
                        <div key={key} className="mb-4">
                            <Heading size="xsmall" level="5" className="mb-1">
                                {key}
                            </Heading>
                            <pre className="p-1 border border-dashed border-ax-border-info-subtle rounded-md">
                                {JSON.stringify(data, null, 2)}
                            </pre>
                        </div>
                    )),
                )}
            </div>
        </>
    )
}

function PersonError({ title, description }: { title: string; description: string | ReactNode }): ReactElement {
    return (
        <LocalAlert status="error" className="max-w-prose mt-4">
            <LocalAlertHeader>
                <LocalAlertTitle>{title}</LocalAlertTitle>
            </LocalAlertHeader>
            <LocalAlertContent>{description}</LocalAlertContent>
        </LocalAlert>
    )
}

export default PersonSearchInfo
