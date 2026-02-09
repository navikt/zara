'use client'

import React, { ReactElement, useCallback, useEffect, useState } from 'react'
import { BodyShort, Heading, Switch, Tooltip } from '@navikt/ds-react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'motion/react'
import { Feedback } from '@navikt/syk-zara'

import { zaraImages } from '../../images/zaras'

import { FeedbackCard } from './FeedbackCard'

function FeedbackToday({ today }: { today: Feedback[] }): ReactElement {
    const [live, setLive] = useState(true)
    const [allToday, setAllToday] = useState(today)
    const newFeedback = useCallback((feedback: Feedback): void => {
        setAllToday((prev) => [feedback, ...prev])
    }, [])

    useLiveFeedback(newFeedback, live)

    return (
        <>
            <div className="flex justify-between items-start">
                <Heading
                    id="all-feedback-heading"
                    level="4"
                    size="small"
                    spacing
                    className="ml-3 flex items-center gap-2"
                >
                    I dag ({allToday.length})
                    {live && (
                        <Tooltip content="Live modus aktivert!">
                            <div className="relative size-3">
                                <div className="bg-ax-meta-purple-500 size-3 rounded-full absolute top-0 left-0" />
                                <div className="bg-ax-meta-purple-500 size-3 rounded-full absolute top-0 left-0 animate-ping" />
                            </div>
                        </Tooltip>
                    )}
                </Heading>
                <Switch
                    size="small"
                    checked={live}
                    onClick={() => {
                        setLive((prev) => !prev)
                    }}
                >
                    Live
                </Switch>
            </div>
            <motion.div className="gap-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence initial={false}>
                    {allToday.map((it) => (
                        <motion.div
                            key={it.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8, y: -20, rotate: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.8, y: 20, rotate: 5 }}
                            transition={{
                                type: 'spring',
                                stiffness: 260,
                                damping: 20,
                                mass: 0.8,
                            }}
                        >
                            <FeedbackCard feedback={it} fresh={'funkyFresh' in it} />
                        </motion.div>
                    ))}
                </AnimatePresence>
                {allToday.length === 0 && (
                    <div className="p-4 bg-ax-bg-raised border border-ax-border-neutral-subtle rounded-md flex gap-4 items-center justify-start">
                        <Image src={zaraImages.mad.src} width={64} height={64} alt="" />
                        <BodyShort size="large" className="text-ax-text-neutral-subtle">
                            Ingen tilbakemeldinger i dag
                        </BodyShort>
                    </div>
                )}
            </motion.div>
        </>
    )
}

function useLiveFeedback(newFeedback: (feedback: Feedback) => void, liveActive: boolean): void {
    useEffect(() => {
        if (!liveActive) return

        const es = new EventSource(`/syk-inn/tilbakemeldinger/live`)

        es.onmessage = (e) => {
            const payload = JSON.parse(e.data)

            newFeedback({ ...payload, funkyFresh: true } as Feedback)
        }

        return () => {
            es.close()
        }
    }, [newFeedback, liveActive])
}

export default FeedbackToday
