import React, { ReactElement } from 'react'
import { Heading } from '@navikt/ds-react'

import { getSykInnApiJobsStatus } from '@services/syk-inn-api/jobs/syk-inn-api-jobs-service'
import JobPanel from '@features/syk-inn/admin/JobPanel'
import RefreshButton from '@features/syk-inn/admin/RefreshButton'

async function SykInnApiJobs(): Promise<ReactElement> {
    const jobs = await getSykInnApiJobsStatus()

    return (
        <div>
            <div className="mb-2 flex justify-between items-center">
                <Heading level="2" size="medium">
                    Jobber i syk-inn-api
                </Heading>
                <RefreshButton />
            </div>
            <div className="">
                {jobs.map((job) => (
                    <JobPanel key={job.name} job={job} />
                ))}
            </div>
        </div>
    )
}

export default SykInnApiJobs
