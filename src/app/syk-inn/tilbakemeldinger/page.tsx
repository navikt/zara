import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'

import { bundledEnv } from '@lib/env'
import { validateUserSession } from '@services/auth/auth'

import { getFeedbackClient } from '../../../services/feedback/feedback-client'
import { seedDevelopmentFeedback } from '../../../dev/seed-valkey'
import FeedbackList from '../../../features/syk-inn/FeedbackList'
import FeedbackListLiveViewBadges from '../../../features/syk-inn/live-view/FeedbackListLiveViewBadges'

export const dynamic = 'force-dynamic'

async function Page(): Promise<ReactElement> {
    const client = getFeedbackClient()
    if (bundledEnv.runtimeEnv === 'local' && (await client.all()).length === 0) {
        await seedDevelopmentFeedback(client)
    }

    /**
     * No fanciness or pagination for now.
     */
    const user = await validateUserSession()
    const feedback = await client.all()

    return (
        <PageBlock as="main" width="2xl" gutters>
            <div className="flex justify-between items-start">
                <Heading level="2" size="large" spacing>
                    Tilbakemelding fra brukere i syk-inn
                </Heading>
                <FeedbackListLiveViewBadges me={user} />
            </div>
            <FeedbackList feedback={feedback} />
        </PageBlock>
    )
}

export default Page
