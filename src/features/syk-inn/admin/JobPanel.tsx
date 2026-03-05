'use client'

import React, { ReactElement, useState, useTransition } from 'react'
import { Button, Detail, Heading } from '@navikt/ds-react'
import { motion, AnimatePresence } from 'motion/react'

import JobStatusIcon from '@features/syk-inn/admin/JobStatusIcon'
import { toReadableDateTime } from '@lib/date'
import { JobStatus, JobStatusResponse } from '@services/syk-inn-api/jobs/types'
import { cn } from '@lib/tw'
import { refetchJobs, startJob, stopJob } from '@features/syk-inn/admin/syk-inn-api-admin-actions'
import useInterval from '@lib/hooks/useInterval'

const STATUS_PRECEDENCE: JobStatus[] = ['FAILED', 'STOPPED', 'NOT_STARTED', 'RUNNING']

type Props = {
    job: JobStatusResponse
}

function JobPanel({ job }: Props): ReactElement {
    const [drawerOpen, setDrawerOpen] = useState(false)
    const worstState = STATUS_PRECEDENCE.find((status) => job.runners.some((pod) => pod.state === status))
    const [pending, startTransition] = useTransition()

    useInterval(() => {
        refetchJobs()
    }, 30_000)

    return (
        <div className="flex">
            <div
                key={job.name}
                className="border border-ax-border-neutral-subtle bg-ax-bg-raised p-4 rounded-md rounded-r-none grow"
            >
                <div className="flex items-start justify-between gap-4">
                    <Heading level="3" size="small" className="flex items-center gap-2" spacing>
                        {worstState && (
                            <div className="self-start mt-2">
                                <JobStatusIcon status={worstState} />
                            </div>
                        )}
                        {job.name} ({job.runners.length} runners)
                    </Heading>
                    <div className="text-sm -mt-1 grid grid-cols-2 grid-rows-[1rem_1rem] gap-x-1">
                        <div className="text-right">State:</div>
                        <div>{worstState}</div>
                        <div className="text-right">Desired:</div>
                        <div>{job.desiredState}</div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {job.runners.map((runner) => (
                        <div
                            key={runner.runner}
                            className={cn('p-2 flex flex-col bg-ax-bg-sunken rounded-md', {
                                'border-2 border-dotted border-ax-danger-500': runner.state === 'FAILED',
                            })}
                        >
                            <div className="flex gap-1.5 items-center mb-2">
                                <div className="self-start mt-1.5">
                                    <JobStatusIcon status={runner.state} />
                                </div>
                                <div className="font-bold truncate min-w-0">{runner.runner}</div>
                            </div>
                            <Detail>Last updated: {toReadableDateTime(runner.updatedAt)}</Detail>
                        </div>
                    ))}
                </div>
                <div suppressHydrationWarning className="mt-2 -mb-2 mr-2 flex justify-end">
                    <Detail>Sist hentet: {toReadableDateTime(new Date(), true)}</Detail>
                </div>
            </div>
            <div className="relative flex">
                <AnimatePresence>
                    {drawerOpen && (
                        <motion.div
                            className={cn('bg-ax-bg-sunken overflow-hidden')}
                            initial={{ width: 0, opacity: 0, scale: 0.95 }}
                            animate={{ width: 128, opacity: 1, scale: 1 }}
                            exit={{ width: 0, opacity: 0, scale: 0.95 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        >
                            <div className="w-32 p-2 pl-3">
                                <Heading level="4" size="xsmall" className="text-center" spacing>
                                    Kontrollpanel
                                </Heading>
                                <div className="flex flex-col gap-3">
                                    <Button
                                        size="small"
                                        variant="secondary"
                                        data-color="success"
                                        loading={pending}
                                        onClick={() => {
                                            startTransition(async () => {
                                                await startJob(job.name)
                                            })
                                        }}
                                    >
                                        Start
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="secondary"
                                        data-color="danger"
                                        loading={pending}
                                        onClick={() => {
                                            startTransition(async () => {
                                                await stopJob(job.name)
                                            })
                                        }}
                                    >
                                        Stop
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div className="relative">
                    <Button
                        size="small"
                        variant="tertiary"
                        className="absolute h-full rounded-l-none w-10 border border-ax-border-neutral-subtle bg-ax-bg-raised [writing-mode:vertical-rl] [text-orientation:mixed]"
                        onClick={() => setDrawerOpen((b) => !b)}
                    >
                        KONTROLLPANEL
                    </Button>
                </div>
            </div>
        </div>
    )
}

export default JobPanel
