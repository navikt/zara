'use server'

import { revalidatePath } from 'next/cache'

import { changeJobStatus } from '@services/syk-inn-api/jobs/syk-inn-api-jobs-service'
import { validateUserSession } from '@services/auth/auth'

export async function startJob(jobName: string): Promise<void> {
    const user = await validateUserSession('UTVIKLER')

    await changeJobStatus(jobName, 'START', user)

    revalidatePath('/syk-inn/admin')
}

export async function stopJob(jobName: string): Promise<void> {
    const user = await validateUserSession('UTVIKLER')

    await changeJobStatus(jobName, 'STOP', user)

    revalidatePath('/syk-inn/admin')
}

export async function refetchJobs(): Promise<void> {
    await validateUserSession('UTVIKLER')

    revalidatePath('/syk-inn/admin')
}
