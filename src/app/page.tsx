import { Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'
import React, { ReactElement } from 'react'

import LandingPage from '#features/landing-page/LandingPage'
import { userFeatures } from '#services/auth/access-control'

async function Page(): Promise<ReactElement> {
    const features = await userFeatures()

    return (
        <PageBlock as="main" width="2xl" gutters>
            <Heading level="2" size="large" spacing>
                Hva vil du gjøre i dag?
            </Heading>
            <LandingPage features={features} />
        </PageBlock>
    )
}

export default Page
