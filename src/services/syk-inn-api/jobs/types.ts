export type JobStatus = 'NOT_STARTED' | 'RUNNING' | 'STOPPED' | 'FAILED'

export type JobRunners = {
    runner: string
    state: JobStatus
    updatedAt: string
}

export type JobStatusResponse = {
    name: 'SYKMELDING_CONSUMER'
    runners: JobRunners[]
    desiredState: JobStatus
    updatedAt: string
}

export type UpdateJobPayload = {
    desiredState: 'START' | 'STOP'
    updatedBy: string
}
