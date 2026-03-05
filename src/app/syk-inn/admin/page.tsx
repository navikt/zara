import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'

import SykInnApiJobs from '@features/syk-inn/admin/SykInnApiJobs'
import LiveUsersList from '@components/live-view/LiveUsersList'
import { validateUserSession } from '@services/auth/auth'

async function Page(): Promise<ReactElement> {
    const user = await validateUserSession()

    return (
        <PageBlock as="main" width="2xl" gutters>
            <div className="flex justify-between items-start">
                <Heading level="2" size="large" spacing>
                    Bruksvilkår for brukere i syk-inn
                </Heading>
                <LiveUsersList page="/syk-inn/admin" me={user} />
            </div>
            <div>
                <SykInnApiJobs />
            </div>
        </PageBlock>
    )
}

export default Page
