import React, { ReactElement } from 'react'
import { logger } from '@navikt/next-logger'
import * as R from 'remeda'
import { BodyShort, Heading, LocalAlert } from '@navikt/ds-react'
import { LocalAlertContent, LocalAlertHeader, LocalAlertTitle } from '@navikt/ds-react/LocalAlert'

import { validateUserSession } from '@services/auth/auth'
import { pdlApiService } from '@services/pdl/pdl-api-service'
import { hprApiService } from '@services/hpr/hpr-service'

type Props = {
    hpr: string
}

async function BehandlerSearchInfo({ hpr }: Props): Promise<ReactElement> {
    await validateUserSession('TEAM_MEMBER')

    const hprPerson = await hprApiService.getHprPerson(hpr)
    if ('errorType' in hprPerson) {
        logger.error(`Unable to find hpr person: ${hpr}, cause: ${hprPerson.errorType}`)

        return (
            <LocalAlert status="error" className="max-w-prose mt-8">
                <LocalAlertHeader>
                    <LocalAlertTitle>Henting fra HPR-register feilet</LocalAlertTitle>
                </LocalAlertHeader>
                <LocalAlertContent>Teknisk feilmelding: {hprPerson.errorType}</LocalAlertContent>
            </LocalAlert>
        )
    }

    if (hprPerson.fnr == null) {
        return (
            <LocalAlert status="error" className="max-w-prose mt-8">
                <LocalAlertHeader>
                    <LocalAlertTitle>Behandler har ikke ident i HPR-registeret</LocalAlertTitle>
                </LocalAlertHeader>
                <LocalAlertContent>
                    <Heading size="small" level="4">
                        All info om person i HPR-registeret
                    </Heading>
                    <div className="max-w-prose border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md rounded-r-none grow">
                        <pre className="overflow-auto">{JSON.stringify(hprPerson, null, 2)}</pre>
                    </div>
                </LocalAlertContent>
            </LocalAlert>
        )
    }

    const pdl = await pdlApiService.getPdlPerson(hprPerson.fnr)
    if ('errorType' in pdl) {
        logger.error(`Error fetching from PDL for ${hpr}, cause: ${pdl.errorType}`)

        return (
            <LocalAlert status="warning" className="max-w-prose mt-8">
                <LocalAlertHeader>
                    <LocalAlertTitle>Behandler fantes i HPR-registeret, men ikke i PDL</LocalAlertTitle>
                </LocalAlertHeader>
                <LocalAlertContent>
                    <BodyShort spacing className="italic">
                        Selv om personen ikke fantes i tsm-pdl-cache, kan du se all info fra HPR-registeret.
                    </BodyShort>
                    <Heading size="small" level="4">
                        All info om person i HPR-registeret
                    </Heading>
                    <div className="max-w-prose border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md rounded-r-none grow">
                        <pre className="overflow-auto">{JSON.stringify(hprPerson, null, 2)}</pre>
                    </div>
                </LocalAlertContent>
            </LocalAlert>
        )
    }

    return (
        <div className="mt-4">
            <Heading size="small" level="4">
                Info om bruker i HPR-registeret
            </Heading>
            <div className="max-w-prose border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md rounded-r-none grow">
                {R.pipe(
                    hprPerson,
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
        </div>
    )
}

export default BehandlerSearchInfo
