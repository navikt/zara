import { logger } from '@navikt/next-logger'

import { bundledEnv } from '#lib/env'
import { raise } from '#lib/ts'
import { getOboToken } from '#services/apps/common/obo'
import { User } from '#services/auth/user'
import { JobStatusResponse, UpdateJobPayload } from '#services/jobs/job-types'

interface Apps {
    url: string
}

export type JobAppName = 'tsm-oppgave' | 'syk-inn-api'

const apps: Record<JobAppName, Apps> = {
    'tsm-oppgave': {
        url: 'http://tsm-oppgave/internal/admin',
    },
    'syk-inn-api': {
        url: 'http://syk-inn-api/internal/admin',
    },
}

export async function getJobsStatus(appName: JobAppName): Promise<JobStatusResponse[]> {
    if (bundledEnv.runtimeEnv === 'local') {
        logger.warn('Mock get job status from tsm-oppgave')

        return [
            {
                name: 'CREATE_OPPGAVE',
                updatedAt: new Date().toISOString(),
                desiredState: 'RUNNING',
                runners: [
                    {
                        runner: 'pod-189b94fd',
                        state: 'RUNNING',
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        runner: 'pod-6cb5f477',
                        state: 'FAILED',
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        runner: 'pod-9c723853',
                        state: 'STOPPED',
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        runner: 'pod-234cea34-b6b8-4528',
                        state: 'NOT_STARTED',
                        updatedAt: new Date().toISOString(),
                    },
                ],
            },
        ]
    }

    const oboToken = await getOboToken(appName)
    const response = await fetch(`${apps[appName].url}/jobs`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}` },
    })

    if (!response.ok) {
        raise(`Failed to fetch job status from ${appName}: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

export async function changeJobStatus(
    appName: JobAppName,
    jobName: string,
    state: 'START' | 'STOP',
    user: User,
): Promise<void> {
    if (bundledEnv.runtimeEnv === 'local') {
        logger.warn(`Mock change job status: ${jobName} -> ${state} by user ${user.userId}`)

        await new Promise((resolve) => setTimeout(resolve, 1000))
        return
    }

    const oboToken = await getOboToken(appName)
    const response = await fetch(`${apps[appName].url}/jobs/${jobName}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}` },
        body: JSON.stringify({
            state: state,
        } satisfies UpdateJobPayload),
    })

    if (!response.ok) {
        raise(`Failed to change job status in ${appName}: ${response.status} ${response.statusText}`)
    }

    return response.json()
}
