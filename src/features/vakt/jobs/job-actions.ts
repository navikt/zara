'use server'

import { revalidatePath } from 'next/cache'

import { validateUserSession } from '#services/auth/auth'
import { changeJobStatus, JobAppName } from '#services/jobs/job-service'

export async function startJob(appName: JobAppName, jobName: string): Promise<void> {
    const user = await validateUserSession('UTVIKLER')

    await changeJobStatus(appName, jobName, 'START', user)

    revalidatePath(`/${appName}/admin`)
}

export async function stopJob(appName: JobAppName, jobName: string): Promise<void> {
    const user = await validateUserSession('UTVIKLER')

    await changeJobStatus(appName, jobName, 'STOP', user)

    revalidatePath(`/${appName}/admin`)
}

export async function refetchJobs(appName: JobAppName): Promise<void> {
    await validateUserSession('UTVIKLER')

    revalidatePath(`/${appName}/admin`)
}
