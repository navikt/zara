import React, { ReactElement } from 'react'
import { PageBlock } from '@navikt/ds-react/Page'
import { Heading } from '@navikt/ds-react'

import { validateUserSession } from '@services/auth/auth'
import LiveUsersList from '@components/live-view/LiveUsersList'
import { getBruksvilkarClient } from '@services/bruksvilkar/bruksvilkar-client'
import BruksvilkarTable from '@features/syk-inn/bruksvilkar/BruksvilkarTable'

async function Page(): Promise<ReactElement> {
    /**
     * No fanciness or pagination for now.
     */
    const user = await validateUserSession()

    const client = getBruksvilkarClient()
    const bruksvilkar = await client.all()

    return (
        <PageBlock as="main" width="2xl" gutters>
            <div className="flex justify-between items-start">
                <Heading level="2" size="large" spacing>
                    Bruksvilkår for brukere i syk-inn
                </Heading>
                <LiveUsersList page="/syk-inn/bruksvilkar" me={user} />
            </div>
            <BruksvilkarTable bruksvilkar={bruksvilkar} />
        </PageBlock>
    )
}

export default Page
