import { Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'
import React, { ReactElement } from 'react'

import LiveUsersList from '#components/live-view/LiveUsersList'
import SykInnApiJobs from '#features/vakt/jobs/SykInnApiJobs'
import TsmOppgaveJobs from '#features/vakt/jobs/TsmOppgaveJobs'
import { validateUserSession } from '#services/auth/auth'

async function Page(): Promise<ReactElement> {
    const user = await validateUserSession('UTVIKLER')

    return (
        <PageBlock as="main" width="2xl" gutters>
            <div className="flex justify-between items-start">
                <Heading level="2" size="large" spacing>
                    Scheduled jobber
                </Heading>
                <LiveUsersList page="/developer-admin/jobs" me={user} />
            </div>
            <div className="flex flex-col gap-4">
                <SykInnApiJobs />
                <TsmOppgaveJobs />
            </div>
        </PageBlock>
    )
}

export default Page
