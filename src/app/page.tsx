import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'

import { userFeatures } from '@services/auth/access-control'
import LandingPage from '@features/landing-page/LandingPage'

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
