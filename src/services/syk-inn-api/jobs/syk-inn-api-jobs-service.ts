import { logger } from '@navikt/next-logger'

import { bundledEnv } from '@lib/env'
import { JobStatusResponse, UpdateJobPayload } from '@services/syk-inn-api/jobs/types'
import { User } from '@services/auth/user'
import { raise } from '@lib/ts'

const SYK_INN_API_JOBS_API = 'http://syk-inn-api-ktor/internal/admin/jobs'

export async function getSykInnApiJobsStatus(): Promise<JobStatusResponse[]> {
    if (bundledEnv.runtimeEnv === 'local') {
        logger.warn('Mock get job status from syk-inn-api')

        return [
            {
                name: 'SYKMELDING_CONSUMER',
                updatedAt: new Date().toISOString(),
                desiredState: 'RUNNING',
                runners: [
                    {
                        runner: 'Pod-1',
                        state: 'RUNNING',
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        runner: 'Pod-2',
                        state: 'FAILED',
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        runner: 'Pod-3',
                        state: 'STOPPED',
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        runner: 'Pod-4',
                        state: 'NOT_STARTED',
                        updatedAt: new Date().toISOString(),
                    },
                ],
            },
        ]
    }

    const response = await fetch(SYK_INN_API_JOBS_API, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    })

    if (!response.ok) {
        raise(`Failed to fetch job status from syk-inn-api: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

export async function changeJobStatus(jobName: string, desiredState: 'START' | 'STOP', user: User): Promise<void> {
    if (bundledEnv.runtimeEnv === 'local') {
        logger.warn(`Mock change job status: ${jobName} -> ${desiredState} by user ${user.userId}`)

        await new Promise((resolve) => setTimeout(resolve, 1000))
        return
    }

    const response = await fetch(`${SYK_INN_API_JOBS_API}/${jobName}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            desiredState,
            updatedBy: user.userId,
        } satisfies UpdateJobPayload),
    })

    if (!response.ok) {
        raise(`Failed to change job status in syk-inn-api: ${response.status} ${response.statusText}`)
    }

    return response.json()
}
