'use client'

import React, { ReactElement, useEffect } from 'react'
import { BodyShort, Detail, Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'
import Image from 'next/image'
import { logger } from '@navikt/next-logger'

import { AkselNextLink } from '@components/AkselNextLink'
import { zaraImages } from '@images/zaras'

type ErrerProps = {
    error: Error & { digest?: string }
}

function Error({ error }: ErrerProps): ReactElement {
    useEffect(() => {
        logger.error(error)
    }, [error])

    return (
        <PageBlock as="main" width="2xl" gutters>
            <div className="flex flex-col items-center justify-center gap-6 mt-8">
                <Heading level="2" size="large">
                    Oj her skjedde det en feil!
                </Heading>
                <Image src={zaraImages.cry.src} width={169} height={169} alt="Zara!" />
                <div>
                    <BodyShort spacing size="large">
                        En ukjent feil i appen oppsto. Dette er ikke noe du gjorde feil!
                    </BodyShort>
                </div>
                <div className="max-w-prose">
                    Du kan prøve å{' '}
                    <AkselNextLink href="/" className="text-ax-text-neutral-subtle">
                        gå tilbake til startsiden
                    </AkselNextLink>
                    , eller så kan du prøve å laste siden på nytt i nettleseren din.
                </div>
                <div className="max-w-prose w-full">
                    <Detail spacing>Teknisk feilmelding</Detail>
                    <pre className="text-xs bg-ax-bg-sunken p-3 rounded-md overflow-x-auto">{error.message}</pre>
                </div>
            </div>
        </PageBlock>
    )
}

export default Error
