'use client'

import { ArrowsCirclepathIcon } from '@navikt/aksel-icons'
import { Button } from '@navikt/ds-react'
import React, { ReactElement, startTransition } from 'react'

import { refetchJobs } from '#features/vakt/jobs/job-actions'
import { JobAppName } from '#services/jobs/job-service'

type Props = {
    appName: JobAppName
}

function RefreshButton({ appName }: Props): ReactElement {
    return (
        <Button
            size="small"
            variant="secondary"
            icon={<ArrowsCirclepathIcon title="Oppdater jobber" />}
            onClick={() => {
                startTransition(async () => {
                    await refetchJobs(appName)
                })
            }}
        />
    )
}

export default RefreshButton
