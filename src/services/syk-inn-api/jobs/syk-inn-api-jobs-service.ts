import { logger } from '@navikt/next-logger'
import { getToken, requestOboToken } from '@navikt/oasis'
import { headers } from 'next/headers'

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

    const oboToken = await getSykInnOboToken()
    const response = await fetch(SYK_INN_API_JOBS_API, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}` },
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

    const oboToken = await getSykInnOboToken()
    const response = await fetch(`${SYK_INN_API_JOBS_API}/${jobName}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${oboToken}` },
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

export async function getSykInnOboToken(): Promise<string> {
    const token = getToken(await headers())
    if (!token) throw new Error('No token found')

    if (bundledEnv.runtimeEnv === 'local') {
        raise('Why are you trying to exchange a token in local environment?')
    }

    const tokenSet = await requestOboToken(token, `api://${bundledEnv.runtimeEnv}.tsm.syk-inn-api-ktor/.default`)
    if (!tokenSet.ok) {
        throw new Error(`Unable to exchange OBO token: ${tokenSet.error.message}`, { cause: tokenSet.error })
    }

    return tokenSet.token
}
