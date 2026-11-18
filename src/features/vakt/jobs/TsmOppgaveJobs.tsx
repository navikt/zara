import { Heading } from '@navikt/ds-react'
import React, { ReactElement } from 'react'
import * as R from 'remeda'

import JobPanel from '#features/vakt/jobs/JobPanel'
import RefreshButton from '#features/vakt/jobs/RefreshButton'
import { getJobsStatus } from '#services/jobs/job-service'

async function TsmOppgaveJobs(): Promise<ReactElement> {
    const jobs = await getJobsStatus('tsm-oppgave')

    return (
        <div>
            <div className="mb-2 flex justify-between items-center">
                <Heading level="2" size="medium">
                    Jobber i tsm-oppgave
                </Heading>
                <RefreshButton appName="tsm-oppgave" />
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 pr-8">
                {R.pipe(
                    jobs,
                    R.sortBy((it) => it.name),
                    R.map((job) => <JobPanel appName="tsm-oppgave" key={job.name} job={job} />),
                )}
            </div>
        </div>
    )
}

export default TsmOppgaveJobs
