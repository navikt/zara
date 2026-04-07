import * as R from 'remeda'
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
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pr-8">
                {R.pipe(
                    jobs,
                    R.sortBy((it) => it.name),
                    R.map((job) => <JobPanel key={job.name} job={job} />),
                )}
            </div>
        </div>
    )
}

export default SykInnApiJobs
