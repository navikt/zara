import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'

import { bundledEnv } from '@lib/env'

import { getFeedbackClient } from '../../../services/feedback/feedback-client'
import { seedDevelopmentFeedback } from '../../../dev/seed-valkey'
import FeedbackList from '../../../features/syk-inn/FeedbackList'

export const dynamic = 'force-dynamic'

async function Page(): Promise<ReactElement> {
    const client = getFeedbackClient()
    if (bundledEnv.runtimeEnv === 'local' && (await client.all()).length === 0) {
        await seedDevelopmentFeedback(client)
    }

    /**
     * No fanciness or pagination for now.
     */
    const feedback = await client.all()

    return (
        <PageBlock as="main" width="2xl" gutters>
            <Heading level="2" size="large" spacing>
                Tilbakemelding fra brukere i syk-inn
            </Heading>
            <FeedbackList feedback={feedback} />
        </PageBlock>
    )
}

export default Page
