import { logger } from '@navikt/next-logger'

import { JobStatusResponse, UpdateJobPayload } from '@services/apps/syk-inn-api/types'
import { bundledEnv } from '@lib/env'
import { User } from '@services/auth/user'
import { raise } from '@lib/ts'
import { getOboToken } from '@services/apps/common/obo'

const SYK_INN_API_ADMIN = 'http://syk-inn-api/internal/admin'

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
            {
                name: 'ANOTHER_JOB' as 'SYKMELDING_CONSUMER',
                updatedAt: new Date().toISOString(),
                desiredState: 'STOPPED',
                runners: [
                    {
                        runner: 'pod-189b94',
                        state: 'STOPPED',
                        updatedAt: new Date().toISOString(),
                    },
                    {
                        runner: 'pod-6cb5f477',
                        state: 'STOPPED',
                        updatedAt: new Date().toISOString(),
                    },
                ],
            },
        ]
    }

    const oboToken = await getOboToken('syk-inn-api')
    const response = await fetch(`${SYK_INN_API_ADMIN}/jobs`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}` },
    })

    if (!response.ok) {
        raise(`Failed to fetch job status from syk-inn-api: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

export async function changeJobStatus(jobName: string, state: 'START' | 'STOP', user: User): Promise<void> {
    if (bundledEnv.runtimeEnv === 'local') {
        logger.warn(`Mock change job status: ${jobName} -> ${state} by user ${user.userId}`)

        await new Promise((resolve) => setTimeout(resolve, 1000))
        return
    }

    const oboToken = await getOboToken('syk-inn-api')
    const response = await fetch(`${SYK_INN_API_ADMIN}/jobs/${jobName}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}` },
        body: JSON.stringify({
            state: state,
        } satisfies UpdateJobPayload),
    })

    if (!response.ok) {
        raise(`Failed to change job status in syk-inn-api: ${response.status} ${response.statusText}`)
    }

    return response.json()
}

export async function markSykmeldingPoisonPilled(uuid: string, reason: string, user: User): Promise<void> {
    if (bundledEnv.runtimeEnv === 'local') {
        logger.warn(`Mock report ${uuid} as poison pill by user ${user.userId}`)

        if (!reason) {
            throw new Error('Missing reason')
        }

        await new Promise((resolve) => setTimeout(resolve, 1000))
        return
    }

    const oboToken = await getOboToken('syk-inn-api')
    const response = await fetch(`${SYK_INN_API_ADMIN}/poison-pills/${uuid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}` },
        body: JSON.stringify({ reason }),
    })

    if (!response.ok) {
        raise(`Failed to change job status in syk-inn-api: ${response.status} ${response.statusText}`)
    }

    return response.json()
}
