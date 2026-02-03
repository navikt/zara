import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'
import { PageBlock } from '@navikt/ds-react/Page'

import { bundledEnv } from '@lib/env'

import { getFeedbackClient } from '../../../services/feedback/feedback-client'
import { seedInMemValkey } from '../../../dev/in-mem-seed'

export const dynamic = 'force-dynamic'

async function Page(): Promise<ReactElement> {
    const feedback = getFeedbackClient()

    const dump = await feedback.dump()
    if (dump.length === 0 || bundledEnv.runtimeEnv === 'local') {
        await seedInMemValkey(feedback)
    }

    return (
        <PageBlock as="main" width="2xl" gutters>
            <Heading level="2" size="xlarge" spacing>
                {`Valkey Testin' Arena`}
            </Heading>
            <div className="bg-ax-bg-raised p-2 rounded-md">
                <pre className="overflow-auto">{JSON.stringify(dump, null, 2)}</pre>
            </div>
        </PageBlock>
    )
}

export default Page
