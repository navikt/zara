export type JobStatus = 'NOT_STARTED' | 'RUNNING' | 'STOPPED' | 'FAILED'

export type JobRunners = {
    runner: string
    state: JobStatus
    updatedAt: string
}

export type JobStatusResponse = {
    name: 'CREATE_OPPGAVE'
    runners: JobRunners[]
    desiredState: JobStatus
    updatedAt: string
}

export type UpdateJobPayload = {
    state: 'START' | 'STOP'
}
