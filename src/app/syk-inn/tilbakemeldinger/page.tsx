import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'

import { validateUserSession } from '@services/auth/auth'
import { getFeedbackClient } from '@services/feedback/feedback-client'
import LiveUsersList from '@components/live-view/LiveUsersList'

import FeedbackList from '../../../features/syk-inn/FeedbackList'

export const dynamic = 'force-dynamic'

async function Page(): Promise<ReactElement> {
    /**
     * No fanciness or pagination for now.
     */
    const user = await validateUserSession('TILBAKEMELDINGER')

    const client = getFeedbackClient()
    const feedback = await client.all()

    return (
        <PageBlock as="main" width="2xl" gutters>
            <div className="flex justify-between items-start">
                <Heading level="2" size="large" spacing>
                    Tilbakemelding fra brukere i syk-inn
                </Heading>
                <LiveUsersList page="/syk-inn/tilbakemeldinger" me={user} />
            </div>
            <FeedbackList feedback={feedback} />
        </PageBlock>
    )
}

export default Page
