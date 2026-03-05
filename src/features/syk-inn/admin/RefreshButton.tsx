'use client'

import React, { ReactElement, startTransition } from 'react'
import { Button } from '@navikt/ds-react'
import { ArrowsCirclepathIcon } from '@navikt/aksel-icons'

import { refetchJobs } from '@features/syk-inn/admin/syk-inn-api-admin-actions'

function RefreshButton(): ReactElement {
    return (
        <Button
            size="small"
            variant="secondary"
            icon={<ArrowsCirclepathIcon title="Oppdater jobber" />}
            onClick={() => {
                startTransition(async () => {
                    await refetchJobs()
                })
            }}
        />
    )
}

export default RefreshButton
