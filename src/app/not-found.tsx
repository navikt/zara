import React, { ReactElement } from 'react'
import { BodyShort, Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'
import Image from 'next/image'

import { AkselNextLink } from '@components/AkselNextLink'

import logo from '../images/sad-sara.webp'

export default function NotFound(): ReactElement {
    return (
        <PageBlock as="main" width="2xl" gutters className="flex flex-col items-center justify-center mt-16">
            <Heading level="2" size="xlarge" spacing>
                404 - Zara fant ikke noe :(
            </Heading>
            <Image src={logo.src} width={256} height={256} alt="Zara!" />
            <BodyShort className="mt-8">
                Gå tilbake til <AkselNextLink href="/">startsiden</AkselNextLink>
            </BodyShort>
        </PageBlock>
    )
}
