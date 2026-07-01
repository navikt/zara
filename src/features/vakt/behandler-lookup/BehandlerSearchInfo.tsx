import { BodyShort, Heading, LocalAlert, Skeleton } from '@navikt/ds-react'
import { LocalAlertContent, LocalAlertHeader, LocalAlertTitle } from '@navikt/ds-react/LocalAlert'
import { logger } from '@navikt/next-logger'
import React, { ReactElement, ReactNode, Suspense } from 'react'
import * as R from 'remeda'

import { validateUserSession } from '#services/auth/auth'
import { hprApiService } from '#services/hpr/hpr-service'
import { pdlApiService } from '#services/pdl/pdl-api-service'

type Props = {
    hpr: string
}

async function BehandlerSearchInfo({ hpr }: Props): Promise<ReactElement> {
    await validateUserSession('TEAM_MEMBER')

    const hprPerson = await hprApiService.getHprPerson(hpr)
    if ('errorType' in hprPerson) {
        logger.error(`Unable to find hpr person: ${hpr}, cause: ${hprPerson.errorType}`)

        return (
            <BehandlerError
                title="Henting fra HPR-register feilet"
                description={`Teknisk feilmelding: ${hprPerson.errorType}`}
            />
        )
    }

    return (
        <div className="mt-4 max-w-prose">
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

            <Suspense
                fallback={
                    <>
                        <Heading size="small" level="4" className="mt-4">
                            Info om bruker i PDL (tsm-pdl-cache)
                        </Heading>
                        <Skeleton variant="rounded" width="100%" height={600} />
                    </>
                }
            >
                <BehandlerInHprRegister ident={hprPerson.fnr} />
            </Suspense>
        </div>
    )
}

function BehandlerError({ title, description }: { title: string; description: string | ReactNode }): ReactElement {
    return (
        <LocalAlert status="error" className="max-w-prose mt-4">
            <LocalAlertHeader>
                <LocalAlertTitle>{title}</LocalAlertTitle>
            </LocalAlertHeader>
            <LocalAlertContent>{description}</LocalAlertContent>
        </LocalAlert>
    )
}

async function BehandlerInHprRegister({ ident }: { ident: string | null }): Promise<ReactElement> {
    if (ident == null) {
        return (
            <BehandlerError
                title="Behandler har ikke ident (fnr/dnr) i HPR-registeret"
                description="Kunne ikke slå opp personen i PDL fordi behandleren mangler ident"
            />
        )
    }

    const pdl = await pdlApiService.getPdlPerson(ident)
    if ('errorType' in pdl) {
        logger.error(`Error fetching from PDL, cause: ${pdl.errorType}`)

        return (
            <LocalAlert status="warning" className="max-w-prose mt-8">
                <LocalAlertHeader>
                    <LocalAlertTitle>Behandler fantes i HPR-registeret, men ikke i PDL</LocalAlertTitle>
                </LocalAlertHeader>
                <LocalAlertContent>
                    <BodyShort spacing className="italic">
                        Selv om personen ikke fantes i tsm-pdl-cache, kan du se all info fra HPR-registeret over.
                    </BodyShort>
                </LocalAlertContent>
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

export default BehandlerSearchInfo
