import React, { ReactElement } from 'react'

import { JobStatus } from '@services/syk-inn-api/jobs/types'
import { cn } from '@lib/tw'

function JobStatusIcon({ status }: { status: JobStatus }): ReactElement {
    return (
        <div className="relative size-3">
            <Dot status={status} />
            {status !== 'RUNNING' && <Dot status={status} ping />}
        </div>
    )
}

function Dot({ status, ping }: { ping?: boolean; status: JobStatus }): ReactElement {
    return (
        <div
            className={cn('h-full w-full rounded-full absolute top-0 left-0', {
                'animate-ping': ping,
                'bg-ax-danger-500': status === 'FAILED',
                'bg-ax-warning-500': status === 'STOPPED',
                'bg-ax-success-500': status === 'RUNNING',
                'bg-ax-neutral-500': status === 'NOT_STARTED',
            })}
        />
    )
}

export default JobStatusIcon
